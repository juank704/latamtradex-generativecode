# Latamtradex — Escalado del modelo de negocio (v2)

> Documento de cambios sobre `prisma/schema.prisma`. Describe el nuevo flujo de **moderación por administrador**, la **generación automática de Órdenes de Compra** y la **regla de negocio de la fecha límite de preparación**.

---

## 1. Resumen ejecutivo

El modelo evoluciona de un catálogo abierto a un **marketplace moderado y transaccional**:

1. **Moderación previa:** los productos y documentos que suben los proveedores quedan en estado `PENDING` y **no son visibles públicamente** hasta que el administrador los `APPROVED`.
2. **Órdenes de Compra:** cuando el administrador **acepta** una cotización, el sistema genera **automáticamente** una `PurchaseOrder` vinculada al proveedor.
3. **Regla de negocio:** una vez generada la Orden de Compra, **el proveedor debe fijar una fecha límite** (`preparationDeadline`) para preparar la entrega; eso mueve la orden de `GENERATED` a `SCHEDULED`.

---

## 2. Cambios en el esquema (`prisma/schema.prisma`)

### 2.1. `User` — rol ADMIN y trazabilidad de revisiones

El campo `role` ya admitía `"ADMIN" | "PROVIDER" | "BUYER"`; se documenta explícitamente y se añaden relaciones nuevas:

| Relación nueva | Propósito |
| --- | --- |
| `reviewedProducts` (`ProductReviewer`) | Productos que este admin ha revisado. |
| `reviewedDocuments` (`DocumentReviewer`) | Documentos que este admin ha revisado. |
| `purchaseOrdersAsProvider` (`ProviderPurchaseOrders`) | Órdenes de compra que debe preparar como proveedor. |
| `purchaseOrdersAsBuyer` (`BuyerPurchaseOrders`) | Órdenes de compra generadas por sus compras. |

> Las relaciones `provider`/`reviewer` hacia `Product` y `Document` ahora están **nombradas** (`ProviderProducts`, `ProductReviewer`, etc.) porque existen múltiples relaciones entre `User` y esos modelos.

### 2.2. `Product` — flujo de aprobación

Campos añadidos:

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `approvalStatus` | `String` (default `"PENDING"`) | `PENDING` \| `APPROVED` \| `REJECTED`. |
| `rejectionReason` | `String?` | Motivo del rechazo (si aplica). |
| `reviewedAt` | `DateTime?` | Cuándo se revisó. |
| `reviewedById` | `String?` | Admin que revisó. |
| `reviewer` | `User?` (`ProductReviewer`) | Relación con el admin revisor (`onDelete: SetNull`). |

> **Visibilidad pública:** el catálogo deberá filtrar `approvalStatus = "APPROVED"` **además** de `isActive = true`. `isActive` se conserva como “retiro suave” por parte del proveedor.

### 2.3. `Document` — flujo de aprobación

Mismos campos de moderación que `Product`: `approvalStatus`, `rejectionReason`, `reviewedAt`, `reviewedById`, `reviewer` (`DocumentReviewer`).

### 2.4. `Quote` — disparador de la Orden de Compra

- Sin cambios de campos.
- Nueva relación **1 a 1**: `purchaseOrder PurchaseOrder?`.
- Al pasar `status` a `"ACCEPTED"`, la aplicación debe crear la `PurchaseOrder` asociada.

### 2.5. `PurchaseOrder` — **modelo nuevo**

```
model PurchaseOrder {
  id                  String    @id @default(cuid())
  orderNumber         String?   @unique        // OC-2026-0001 (generado por la app)
  quantity            Int
  unitPrice           Float
  totalAmount         Float
  incoterm            String
  destinationCity     String
  destinationCountry  String
  status              String    @default("GENERATED")
  preparationDeadline DateTime?                 // <- regla de negocio
  deadlineSetAt       DateTime?
  providerNotes       String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  quoteId             String    @unique         // 1 a 1 con la cotizacion
  ...relaciones: quote, product, provider, buyer
}
```

**Máquina de estados (`status`):**

| Estado | Significado | Quién lo provoca |
| --- | --- | --- |
| `GENERATED` | Recién creada; falta fecha límite. | Sistema (al aceptar cotización) |
| `SCHEDULED` | El proveedor fijó `preparationDeadline`. | Proveedor |
| `PREPARING` | Preparando el pedido. | Proveedor |
| `READY` | Listo para despacho. | Proveedor |
| `SHIPPED` | En tránsito. | Admin / Proveedor |
| `DELIVERED` | Entregado. | Admin |
| `CANCELED` | Cancelada. | Admin |

Se guardan **snapshots** (`unitPrice`, `totalAmount`, `quantity`, `incoterm`, destino) para que la orden sea un registro inmutable aunque cambien la cotización o el producto.

---

## 3. Diagrama de relaciones (resumen)

```
User (ADMIN)
  ├── revisa ─────► Product.reviewer / Document.reviewer
  └── acepta ─────► Quote ──(1:1)──► PurchaseOrder
                                        ├── provider ─► User (PROVIDER)  [fija deadline]
                                        ├── buyer ────► User (BUYER)
                                        └── product ──► Product
```

---

## 4. Flujo de negocio completo

1. **Proveedor** publica producto → `Product.approvalStatus = PENDING` (no visible en catálogo).
2. **Admin** revisa en el panel → `APPROVED` (visible) o `REJECTED` (+ `rejectionReason`).
3. **Comprador** ve el producto aprobado y solicita una `Quote` (`PENDING`).
4. **Admin** cotiza (`QUOTED`) con costos logísticos/aduaneros.
5. **Admin** acepta (`ACCEPTED`) → el sistema crea `PurchaseOrder` (`GENERATED`).
6. **Proveedor** abre la OC y **fija `preparationDeadline`** → `SCHEDULED`.
7. La OC avanza por `PREPARING → READY → SHIPPED → DELIVERED`.

---

## 5. Migración

Como SQLite y Prisma, aplicar el nuevo esquema con:

```bash
# Desarrollo (genera migración versionada)
npx prisma migrate dev --name v2_aprobacion_y_ordenes_compra

# Docker / SQLite (sincronización directa, ya usada por el entrypoint)
npx prisma db push
```

> ⚠️ **Impacto en datos existentes:** los productos/documentos ya creados tomarán `approvalStatus = "PENDING"` por defecto y dejarán de verse en el catálogo una vez se aplique el filtro de visibilidad. Para la demo conviene actualizar el `seed.ts` para marcarlos como `APPROVED`.

---

## 6. Pendientes de implementación (siguientes pasos, fuera de este cambio de esquema)

Estos cambios de esquema **habilitan** la funcionalidad; falta el código de aplicación:

- [ ] Filtrar `approvalStatus = "APPROVED"` en `catalogo`, home y detalle de producto.
- [ ] Panel admin: moderación de productos (`/dashboard/admin/productos`) y documentos (`/dashboard/admin/documentos`) con aprobar/rechazar.
- [ ] Endpoint que, al aceptar una `Quote`, cree la `PurchaseOrder` dentro de una transacción.
- [ ] Vista del proveedor para fijar `preparationDeadline` y avanzar el estado de la OC.
- [ ] Validaciones Zod para los nuevos estados (`approvalStatus`, estados de `PurchaseOrder`).
- [ ] Generador de `orderNumber` legible (ej. `OC-2026-0001`).
- [ ] Actualizar `seed.ts` (productos demo `APPROVED`).
```
