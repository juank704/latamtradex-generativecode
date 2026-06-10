# Latamtradex

> Plataforma web full-stack que funciona como **operador logístico** para conectar proveedores latinoamericanos con compradores en el exterior (Chile, Perú y otros mercados). Latamtradex elimina la fricción aduanera ofreciendo cotizaciones logísticas integrales, gestión documental certificada y asesorías especializadas.

---

## Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Framework | **Next.js 14** (App Router, React Server Components) |
| Lenguaje | **TypeScript** |
| Base de datos | **SQLite** (vía volumen persistente) |
| ORM | **Prisma** |
| Estilos | **Tailwind CSS** |
| Autenticación | JWT firmado con `jose` + `bcryptjs` (cookies HTTP-only) |
| Pagos | **Stripe Checkout** (modo prueba) |
| Validación | **Zod** |
| Contenedores | **Docker** + **Docker Compose** |

---

## Funcionalidades (módulos)

1. **Autenticación y usuarios** — registro, login, logout y control de acceso por rol (`ADMIN`, `PROVIDER`, `BUYER`).
2. **Catálogo público** — listado y detalle de productos visible sin login, con filtros por categoría y búsqueda.
3. **Documentación del proveedor** — área privada para subir certificados, fichas técnicas y documentos de exportación (PDF/DOC/imagen, máx 8 MB), asociables a un producto.
4. **Cotizaciones logísticas** — los compradores solicitan una cotización integral desde el producto; el equipo Latamtradex (rol `ADMIN`) agrega costos logísticos y aduaneros, calcula total estimado y notifica al comprador.
5. **Asesorías + Stripe** — catálogo de servicios (certificación, apertura de mercados, optimización logística) con pasarela Stripe Checkout (modo prueba). Si Stripe no está configurado, se activa un **modo demo** que simula el pago.

---

## Arquitectura

```
src/
├── app/                       # App Router (Next.js)
│   ├── api/                   # Endpoints REST
│   │   ├── auth/{login,register,logout}
│   │   ├── products/          # CRUD productos
│   │   ├── documents/         # Carga de documentos (multipart)
│   │   ├── quotes/            # Crear y actualizar cotizaciones
│   │   └── checkout/          # Crea sesión Stripe
│   ├── catalogo/              # Catálogo público
│   ├── productos/[id]/        # Detalle + formulario de cotización
│   ├── asesorias/             # Servicios de asesoría
│   ├── checkout/success/      # Confirmación de pago
│   ├── login/, registro/
│   └── dashboard/
│       ├── admin/             # Resumen, cotizaciones, usuarios
│       ├── proveedor/         # Productos y documentos
│       └── comprador/         # Cotizaciones y asesorías
├── components/                # UI compartida
└── lib/                       # prisma, auth, stripe, validation
prisma/
├── schema.prisma              # Modelos (User, Product, Document, Quote, AdvisoryService, AdvisoryOrder)
└── seed.ts                    # Datos iniciales
```

### Modelo de datos (Prisma)

- **User** — `role: ADMIN | PROVIDER | BUYER`
- **Product** — pertenece a un `PROVIDER`, visible públicamente.
- **Document** — pertenece a un `PROVIDER`, opcionalmente vinculado a un producto.
- **Quote** — solicitada por `BUYER`, gestionada por `ADMIN`; incluye costos logísticos/aduaneros.
- **AdvisoryService** + **AdvisoryOrder** — servicios contratables con Stripe.

---

## Puesta en marcha rápida

### Opción A — Local con Node.js

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env
#   Edita AUTH_SECRET y, si vas a probar pagos reales, las claves de Stripe.

# 3. Crear la base de datos y ejecutar migraciones
npx prisma migrate dev --name init

# 4. Cargar datos de prueba
npm run prisma:seed

# 5. Levantar el servidor de desarrollo
npm run dev
```

Aplicación disponible en **http://localhost:3000**.

### Opción B — Docker Compose (entorno reproducible)

```bash
# (opcional) personaliza variables en un archivo .env de la raiz
docker compose up --build
```

La imagen multi-stage:
1. Instala dependencias (`deps`).
2. Genera el cliente Prisma y compila Next.js (`builder`).
3. Empaqueta el bundle `standalone` con un usuario no-root (`runner`).

Al arrancar, el `docker-entrypoint.sh` sincroniza el esquema con `prisma db push` (apropiado para SQLite). Para poblar datos iniciales dentro del contenedor:

```bash
docker compose exec app npx prisma db seed
```

Los volúmenes `latamtradex-db` y `latamtradex-uploads` preservan la base SQLite y los archivos subidos entre reinicios.

---

## Cuentas de demostración (tras `npm run prisma:seed`)

| Rol | Email | Contraseña |
| --- | --- | --- |
| Admin | `admin@latamtradex.com` | `Latamtradex2026!` |
| Proveedor | `proveedor@latamtradex.com` | `Latamtradex2026!` |
| Comprador | `comprador@latamtradex.com` | `Latamtradex2026!` |

Cambia las contraseñas antes de exponer la aplicación.

---

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión SQLite (`file:./dev.db` o `file:/app/data/prod.db` en Docker). |
| `AUTH_SECRET` | Secreto para firmar JWT de sesión (mínimo 32 caracteres). |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe en modo prueba (`sk_test_...`). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe. |
| `NEXT_PUBLIC_APP_URL` | URL base usada para `success_url`/`cancel_url` de Stripe. |

Si `STRIPE_SECRET_KEY` no está definido o contiene el valor `replace_me`, el módulo de asesorías opera en **modo demo** y marca los pedidos como pagados sin contactar a Stripe.

---

## Scripts npm

| Script | Acción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (`prisma generate` + `migrate deploy` + `next build`) |
| `npm start` | Arranque del bundle compilado |
| `npm run prisma:migrate` | Crea/aplica migraciones en desarrollo |
| `npm run prisma:seed` | Carga datos iniciales |
| `npm run db:reset` | Reinicia la base SQLite (¡destructivo!) |

---

## Roles y matriz de acceso

| Acción | Anónimo | BUYER | PROVIDER | ADMIN |
| --- | :-: | :-: | :-: | :-: |
| Ver catálogo y detalle | ✅ | ✅ | ✅ | ✅ |
| Registrarse / iniciar sesión | ✅ | ✅ | ✅ | ✅ |
| Solicitar cotización | ❌ | ✅ | ❌ | ❌ |
| Publicar productos | ❌ | ❌ | ✅ | ✅ |
| Subir documentación | ❌ | ❌ | ✅ | ✅ |
| Procesar cotizaciones | ❌ | ❌ | ❌ | ✅ |
| Contratar asesorías | ❌ | ✅ | ✅ | ❌ |
| Ver usuarios | ❌ | ❌ | ❌ | ✅ |

---

## Próximos pasos sugeridos

- Webhooks de Stripe para confirmar pagos de manera asíncrona.
- Notificaciones por email (Resend / SendGrid) al cambiar estados de cotización.
- Migrar SQLite a PostgreSQL para multi-tenant en producción.
- Tests E2E con Playwright (cubrir flujo: registrar comprador → cotizar → admin procesa → comprador acepta).

---

## Licencia

Proyecto académico — Máster Universitario 2026. Uso educativo.
