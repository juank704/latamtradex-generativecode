# Latamtradex

> Plataforma web full-stack que funciona como **operador logístico**: conecta proveedores latinoamericanos con compradores en el exterior (Chile, Perú y otros mercados), eliminando la fricción aduanera con cotizaciones logísticas integrales, moderación de productos/documentos, órdenes de compra con seguimiento y asesorías con pago en línea.

---

## 📑 Tabla de contenido

1. [Requisitos previos](#-requisitos-previos)
2. [Ejecutar con Docker](#-ejecutar-con-docker)
3. [🔑 Credenciales de acceso (demo)](#-credenciales-de-acceso-demo)
4. [🧭 Guía de uso paso a paso](#-guía-de-uso-paso-a-paso)
5. [Solución de problemas](#-solución-de-problemas)

---

## ✅ Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución (incluye Docker Compose v2). Es lo único que se necesita.

> No se necesitan claves de Stripe para evaluar el sistema: el módulo de pagos detecta que no están configuradas y entra en **modo demo** (simula el pago correctamente).

---

## 🐳 Ejecutar con Docker

### 0. Descargar el proyecto

```bash
git clone https://github.com/juank704/latamtradex-generativecode.git
cd latamtradex-generativecode
```

Los siguientes comandos se ejecutan desde la carpeta raíz del proyecto (donde está el `docker-compose.local.yml`).

### 1. Construir y levantar la aplicación

```bash
docker compose -f docker-compose.local.yml up -d --build
```

Esto construye la imagen, levanta el contenedor `latamtradex-app` y **aplica automáticamente el esquema de base de datos** (el script de arranque ejecuta `prisma db push`). La app queda disponible en:

👉 **http://localhost:3000**

### 2. Cargar los datos de demostración (seed)

La imagen de producción es liviana y no incluye el cargador de datos, así que el seed se ejecuta con un contenedor auxiliar que comparte el mismo volumen de base de datos:

```bash
# a) Construir una imagen auxiliar con las herramientas de desarrollo
docker build --target builder -t latamtradex-builder .

# b) Ejecutar el seed contra la base de datos del contenedor
docker run --rm \
  -v latamtradex-generativecode_latamtradex-db:/app/data \
  -e DATABASE_URL="file:/app/data/prod.db" \
  latamtradex-builder npx tsx prisma/seed.ts
```

Al terminar verás impresas las credenciales demo. **Recarga http://localhost:3000** y ya tendrás el catálogo poblado.

> ℹ️ El nombre del volumen (`latamtradex-generativecode_latamtradex-db`) es el del proyecto. Si tu carpeta tiene otro nombre, localízalo con `docker volume ls` y reemplázalo en el comando.

### 3. Detener / reiniciar

```bash
docker compose -f docker-compose.local.yml stop      # detener (conserva datos)
docker compose -f docker-compose.local.yml up -d     # volver a levantar
docker compose -f docker-compose.local.yml down      # eliminar contenedor (conserva volúmenes/datos)
docker compose -f docker-compose.local.yml down -v   # eliminar TODO, incluida la base de datos
```

---

## 🔑 Credenciales de acceso (demo)

Tras ejecutar el seed (paso 2), puedes entrar en **http://localhost:3000/login** con cualquiera de estos usuarios. **La contraseña es la misma para los tres:**

| Rol | Correo | Contraseña |
| --- | --- | --- |
| 🛡️ **Administrador** (Latamtradex) | `admin@latamtradex.com` | `Latamtradex2026!` |
| 📦 **Proveedor** | `proveedor@latamtradex.com` | `Latamtradex2026!` |
| 🛒 **Comprador** | `comprador@latamtradex.com` | `Latamtradex2026!` |

> Estas credenciales también se muestran en un recuadro dentro de la propia página de login para mayor comodidad.

---

## 🧭 Guía de uso paso a paso

A continuación, un recorrido completo que ejercita todas las funcionalidades. Se recomienda hacerlo en este orden para ver el flujo de negocio de principio a fin.

### Parte 0 — Navegación pública (sin login)
1. Abre **http://localhost:3000**.
2. Entra a **Catálogo** (menú superior): verás los productos aprobados, con búsqueda y filtro por categoría.
3. Haz clic en un producto para ver su ficha, precio, origen y documentación certificada.

### Parte 1 — Proveedor: publicar producto y documentación
1. Inicia sesión como **proveedor** (`proveedor@latamtradex.com`).
2. En el panel lateral entra a **Mis productos → “+ Nuevo producto”**, complétalo y publícalo.
   - El producto queda en estado **“En revisión”** y *aún no aparece* en el catálogo público.
3. Entra a **Documentación** y sube un archivo (PDF/imagen) como certificado de calidad. También queda “En revisión”.

### Parte 2 — Administrador: moderar (aprobar/rechazar)
1. Cierra sesión e inicia como **administrador** (`admin@latamtradex.com`).
2. En el panel verás tarjetas de “pendientes”. Entra a **Moderar productos**.
3. Pulsa **Aprobar** en el producto del proveedor (o **Rechazar** indicando un motivo).
   - Al aprobarlo, ya aparece en el **catálogo público**.
4. Repite en **Moderar documentos** para validar el certificado subido.

### Parte 3 — Comprador: cotizar con condiciones de pago
1. Cierra sesión e inicia como **comprador** (`comprador@latamtradex.com`).
2. Ve al **Catálogo**, abre un producto y completa el formulario **“Solicitar cotización”**:
   - Cantidad, ciudad/país de destino, Incoterm.
   - **Forma de pago** (Transferencia / Tarjeta / Efectivo) y **Condición de pago** (Al contado / A la entrega / Crédito 30 días).
3. Envía la solicitud. Quedará como **“Pendiente”** en tu panel.

### Parte 4 — Administrador: cotizar y aceptar (se genera la Orden de Compra)
1. Vuelve a entrar como **administrador** → **Cotizaciones**.
2. Abre la cotización del comprador: verás la forma y condición de pago elegidas.
3. Ingresa el **costo logístico** y **aduanero**, cambia el estado a **“Aceptado”** y guarda.
   - Al aceptar, el sistema **genera automáticamente una Orden de Compra** (código `OC-2026-XXXX`) vinculada al proveedor.

### Parte 5 — Proveedor: fijar fecha límite y avanzar el pedido
1. Entra como **proveedor** → **Órdenes de compra**.
2. La nueva orden está en estado **“Generada”**: **fija la fecha límite de preparación** (regla de negocio) y confírmala → pasa a **“Programada”**.
3. Avanza el estado del pedido conforme lo preparas: **Preparando → Lista → Despachada → Entregada**.

### Parte 6 — Comprador: seguimiento en tiempo real
1. Entra como **comprador** → panel principal (**Seguimiento de pedidos**).
2. Verás una **barra de progreso** de tu Orden de Compra avanzando por los estados
   (Generada → Programada → Preparando → Lista → Enviada → Entregada), junto con la fecha límite y las condiciones de pago.

### Parte 7 — Asesorías con pago (Stripe / demo)
1. Con cualquier usuario (comprador o proveedor) entra a **Asesorías** (menú superior).
2. Elige un servicio y pulsa **Contratar**.
   - Sin claves de Stripe configuradas, el pago se procesa en **modo demo** y la orden queda como **“PAID”**.
3. Revisa el resultado en **Panel → Mis asesorías**.

---

## 🛠 Solución de problemas

| Problema | Solución |
| --- | --- |
| El catálogo aparece vacío | No se ejecutó el seed. Repite el **paso 2**. |
| `localhost:3000` no responde | Verifica que el contenedor esté arriba: `docker compose -f docker-compose.local.yml ps`. Revisa logs: `docker logs latamtradex-app`. |
| El comando de seed no encuentra el volumen | Lista los volúmenes con `docker volume ls` y usa el que termine en `_latamtradex-db`. |
| Quiero empezar de cero | `docker compose -f docker-compose.local.yml down -v` y repite desde el paso 1. |
| Cambié código y no se refleja | Reconstruye la imagen: `docker compose -f docker-compose.local.yml up -d --build`. |

---

## 📂 Documentación adicional

- [`docs/CAMBIOS_modelo_negocio_v2.md`](docs/CAMBIOS_modelo_negocio_v2.md) — detalle del modelo de datos y flujo de aprobación + órdenes de compra.

---

Proyecto académico — Máster Universitario 2026. Uso educativo.
