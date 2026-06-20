# Latamtradex

> Plataforma web full-stack que funciona como **operador logístico**: conecta proveedores latinoamericanos con compradores en el exterior (Chile, Perú y otros mercados), eliminando la fricción aduanera con cotizaciones logísticas integrales, moderación de productos/documentos, órdenes de compra con seguimiento y asesorías con pago en línea.

> 🧪 **Actividad 2 — Pruebas automatizadas.** Esta entrega añade pruebas unitarias (Jest), pruebas E2E reales (Playwright) y un **overlay de demo autoejecutable**. Puedes verlas funcionando directamente en producción o en local con Docker (ver secciones de abajo).

### 🌐 Demo en producción

> **URL de producción:** **https://latamtradex-actividad2.azucarsintactica.com/**
>
> Para ver las pruebas del flujo completo ejecutándose en vivo, abre:
> **https://latamtradex-actividad2.azucarsintactica.com/?demo=1** y pulsa **▶ Play** en el panel de la **esquina inferior derecha**.

---

## 📑 Tabla de contenido

1. [🧪 Ejecutar las pruebas automatizadas](#-ejecutar-las-pruebas-automatizadas)
2. [🎭 Pruebas E2E con Playwright](#-pruebas-e2e-con-playwright-flujo-completo)
3. [▶️ Overlay de demo guiada](#️-overlay-de-demo-guiada-presentación-en-vivo)
4. [Requisitos previos](#-requisitos-previos)
5. [Ejecutar con Docker](#-ejecutar-con-docker)
6. [🔑 Credenciales de acceso (demo)](#-credenciales-de-acceso-demo)
7. [🧭 Guía de uso paso a paso](#-guía-de-uso-paso-a-paso)
8. [Solución de problemas](#-solución-de-problemas)

---

## 🧪 Ejecutar las pruebas automatizadas

> **Actividad 2 — parte principal.** Las pruebas (unitarias y de componentes con **Jest** + **React Testing Library**) se ejecutan dentro de Docker, sin necesidad de instalar nada en tu máquina.

Desde la carpeta raíz del proyecto:

```bash
# Opción 1 — con Docker Compose (recomendada)
docker compose -f docker-compose.local.yml --profile tests run --rm unit

# Opción 2 — con docker build + run
docker build --target builder -t latamtradex-builder .
docker run --rm latamtradex-builder npm run test:coverage
```

Resultado esperado: **43 pruebas en verde (5 suites)**.

```
Test Suites: 5 passed, 5 total
Tests:       43 passed, 43 total
```

### Qué se prueba

| Suite | Funcionalidad crítica |
| --- | --- |
| `__tests__/auth.roles.test.ts` | Roles y autenticación — diferencia ADMIN / PROVIDER / BUYER y control de acceso (`requireRole`). |
| `__tests__/purchaseOrderStateMachine.test.ts` | Máquina de estados de la Orden de Compra (GENERATED → SCHEDULED → PREPARING → … → DELIVERED). |
| `__tests__/buyerPanelTimeline.test.tsx` | Componente UI del Panel del Comprador (línea de tiempo del pedido). |
| `__tests__/validation.test.ts` | Esquemas de validación Zod (cotización con pago, registro, moderación). |
| `__tests__/demoFlow.test.ts` | Definición compartida del flujo E2E/demo (hitos del negocio). |

### Otros comandos de prueba

```bash
docker run --rm latamtradex-builder npm test          # ejecutar sin cobertura
docker run --rm latamtradex-builder npm run test:watch  # modo interactivo (watch)
```

> ℹ️ Las pruebas corren en la imagen `builder` (que incluye las dependencias de desarrollo). El contenedor de la aplicación en ejecución es una imagen liviana de producción y no incluye el entorno de pruebas, por eso se usa una imagen dedicada.

---

## 🎭 Pruebas E2E con Playwright (Actividad 2 — flujo completo)

Pruebas **end-to-end** reales que manejan un navegador (Chromium) y recorren el flujo de negocio completo: proveedor publica → admin aprueba → comprador cotiza → admin acepta (genera la Orden de Compra) → proveedor avanza la orden → comprador ve el seguimiento → asesoría con pago demo.

Corren **dentro de Docker** (misma imagen `builder`), que ya incluye Playwright + Chromium. El propio comando levanta un servidor con la base **sembrada** automáticamente.

### Opción 1 — con Docker Compose (recomendada)

Desde la raíz del proyecto:

```bash
# Suite E2E completa (Playwright)
docker compose -f docker-compose.local.yml --profile tests run --rm e2e

# Pruebas unitarias con cobertura (Jest)
docker compose -f docker-compose.local.yml --profile tests run --rm unit
```

### Opción 2 — con docker build + run

```bash
# Construir la imagen (si no se hizo ya)
docker build --target builder -t latamtradex-builder .

# Ejecutar toda la suite E2E (headless)
docker run --rm latamtradex-builder npm run e2e
```

Resultado esperado: **6 pruebas en verde**.

```
✓ flujo completo de negocio (happy path)
✓ login como ADMIN / PROVIDER / BUYER redirige a su panel
✓ un BUYER no puede acceder al panel de ADMIN
✓ una visita anónima al panel redirige a login
6 passed
```

### Variantes

```bash
# Apuntar a la URL de PRODUCCIÓN (no levanta servidor local ni siembra):
docker run --rm -e E2E_BASE_URL=https://latamtradex-actividad2.azucarsintactica.com/ \
  latamtradex-builder npm run e2e

# En local (fuera de Docker), ver el navegador en vivo y a cámara lenta:
npm install
npx playwright install chromium
E2E_SLOWMO=400 npm run e2e:headed   # con --slowmo
npm run e2e:ui                       # modo UI con time-travel
```

- **`baseURL`** se controla con `E2E_BASE_URL` (por defecto `http://localhost:3000`).
- **Trace activado** (`trace: on`): cada paso queda registrado con screenshots time-travel. Tras una corrida, abre el reporte con `npx playwright show-report` o un trace con `npx playwright show-trace <archivo>`. En fallo se guardan screenshots en `test-results/`.
- **Datos**: el script `e2e:server` ejecuta `prisma db push` + seed antes de arrancar. El flujo crea un producto con **nombre único por corrida** (`Café E2E <timestamp>`), por lo que es repetible (idempotente).

---

## ▶️ Overlay de demo guiada (presentación en vivo)

Además de los tests, la app incluye un **overlay de demostración** que reproduce el mismo flujo manejando la UI real (rellena formularios, aprueba, cotiza, avanza la orden…), resaltando cada elemento. Es **solo para presentación**, no es un test.

![Overlay de demo guiada de Latamtradex](docs/demo-overlay.png)

### Cómo activarlo

Añade `?demo=1` a la URL y aparecerá un panel flotante en la **esquina inferior derecha**. Pulsa **▶ Play** para que ejecute solo el flujo completo.

- **En producción:** **https://latamtradex-actividad2.azucarsintactica.com/?demo=1**
- **En local:** `http://localhost:7084/?demo=1`

Controles del panel (esquina inferior derecha):

- **▶ Play** — inicia la demo guiada. Verás la barra de progreso y el log de pasos.
- **⏸ Pausa** / **⏹ Stop** — para controlarla.
- Sobrevive a los cambios de página (persiste su estado en `localStorage` y continúa tras cada navegación).
- Para desactivarlo: `?demo=0` (o pulsa Stop). **No aparece por defecto** (requiere activación explícita).

> Tanto el overlay como los tests E2E consumen la **misma definición de pasos** (`src/lib/demoFlow.ts`), de modo que el flujo se define una sola vez.

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

👉 **http://localhost:7084**

> El `docker-compose.local.yml` publica el puerto **7084** del host (mapeado al 3000 del contenedor). Si quieres otro puerto, edita la línea `ports: ["7084:3000"]`.

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

Al terminar verás impresas las credenciales demo. **Recarga http://localhost:7084** y ya tendrás el catálogo poblado.

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

Tras ejecutar el seed (paso 2), puedes entrar en **http://localhost:7084/login** (o en producción **https://latamtradex-actividad2.azucarsintactica.com/login**) con cualquiera de estos usuarios. **La contraseña es la misma para los tres:**

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
1. Abre **http://localhost:7084**.
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
| `localhost:7084` no responde | Verifica que el contenedor esté arriba: `docker compose -f docker-compose.local.yml ps`. Revisa logs: `docker logs latamtradex-app`. |
| El comando de seed no encuentra el volumen | Lista los volúmenes con `docker volume ls` y usa el que termine en `_latamtradex-db`. |
| Quiero empezar de cero | `docker compose -f docker-compose.local.yml down -v` y repite desde el paso 1. |
| Cambié código y no se refleja | Reconstruye la imagen: `docker compose -f docker-compose.local.yml up -d --build`. |

---

## 📂 Documentación adicional

- [`docs/CAMBIOS_modelo_negocio_v2.md`](docs/CAMBIOS_modelo_negocio_v2.md) — detalle del modelo de datos y flujo de aprobación + órdenes de compra.

---

Proyecto académico — Máster Universitario 2026. Uso educativo.
