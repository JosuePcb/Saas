# LogiPyme — Frontend Onboarding para Wilmer
> Guía completa para arrancar el proyecto desde cero

---

## 1. Contexto del Proyecto

LogiPyme es un SaaS de micro-logística para PYMEs venezolanas. El backend ya está construido en Spring Boot. Este repositorio es el frontend completo.

### Tecnología del frontend

| Tecnología | Uso |
|---|---|
| React 18 + Vite 5 | Framework principal + bundler |
| TypeScript 5 | Tipado estático |
| Tailwind CSS v4 | Utilidades de estilos |
| Shadcn/UI | Componentes base accesibles |
| TanStack Query 5 | Cache y fetching del servidor |
| Zustand 4 | Estado global del cliente (auth) |
| React Router 6 | Navegación SPA |
| Axios 1 | Cliente HTTP con interceptores JWT |
| Leaflet + React-Leaflet | Mapas con OpenStreetMap |
| idb | IndexedDB para modo offline |

> ⚠️ **Tailwind v4** — la configuración es diferente a v3. No uses `@apply font-sans` para fuente global. Los estilos globales van directamente en `src/index.css` con CSS puro.

---

## 2. Sistema de Diseño Visual

**⚠️ Esto es crítico — todo el equipo debe usar exactamente estos valores.**

### Paleta de colores

| Nombre | Valor | Uso |
|---|---|---|
| Fondo principal | `#1f0d18` | Fondo del `<main>` y AppShell |
| Sidebar / TopBar | `#1a0a14` | Borgoña oscuro profundo |
| Cards oscuras | `#2d1122` | Cards sobre fondo principal |
| Cards más claras | `#361428` | Hover / cards secundarias |
| Pink principal | `#EC4899` | Botones CTA, activos, gradiente |
| Lila acento | `#D8B4FE` | Labels, gradientes, secundario |
| Grafito | `#4B5563` | Texto sobre fondos claros |
| Success | `#10B981` | Estados exitosos |
| Warning | `#F59E0B` | Estados de alerta |
| Error / Cancelado | `#EF4444` | Estados de error |
| Info / Creado | `#3B82F6` | Estados informativos |

### Gradiente único de la marca
```css
background: linear-gradient(135deg, #EC4899, #D8B4FE);
```
Se usa en: botón CTA, avatar de usuario, íconos de sección, step activo en wizard.

### Tipografía
- **Fuente**: Plus Jakarta Sans (Google Fonts — ya importada en `index.html`)
- **Tamaño mínimo**: 15px en cualquier texto visible
- **Títulos de sección**: 16-17px
- **Títulos de página (h1)**: 28-32px, `fontWeight: 900`
- **Constante de fuente** (usar en todos los archivos):
```typescript
const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
```

### Sombras de cards (sobre fondo oscuro)
```css
/* Card estándar */
box-shadow: 0 4px 24px rgba(0,0,0,0.35), 0 1px 4px rgba(236,72,153,0.1);
border: 1px solid rgba(236,72,153,0.12);
```

---

## 3. Roles del Sistema

| Rol | Descripción | Ruta base |
|---|---|---|
| `SUPER_ADMIN` | Equipo SaaS. Gestiona todos los tenants | `/app/superadmin` |
| `ADMIN_PYME` | Dueño/Gerente de la empresa | `/app/dashboard` |
| `DESPACHADOR` | Operador logístico | `/app/dashboard` |
| `CHOFER` | Repartidor, usa vista móvil PWA | `/app/driver` |

Los roles viven en `src/types/enums.ts`. **No los modifiques.**

---

## 4. División de Trabajo

### ✅ Tuyas (Wilmer)

| Página | Ruta |
|---|---|
| Tracking Público | `/tracking/:orderId` |
| Home del Chofer (lista de paradas del día) | `/app/driver` |
| Detalle de parada (con captura de foto PoD) | `/app/driver/stop/:id` |
| Dashboard global SuperAdmin | `/app/superadmin` |
| Cola de pagos pendientes | `/app/superadmin/payments` |
| Gestión de tenants | `/app/superadmin/tenants` |

### 🚫 De José (NO tocar)

| Página | Ruta |
|---|---|
| Dashboard | `/app/dashboard` |
| Lista de órdenes | `/app/orders` |
| Detalle de orden | `/app/orders/:id` |
| Nueva orden | `/app/orders/new` |
| Lista de rutas | `/app/routes` |
| Detalle de ruta | `/app/routes/:id` |
| Flota de vehículos | `/app/fleet` |
| Usuarios | `/app/users` |
| Facturación | `/app/billing` |
| Settings | `/app/settings` |

> Las páginas de Wilmer ya tienen sus rutas registradas en el router con el componente `<ComingSoon>`. Solo hay que reemplazar ese componente por la página real.

---

## 5. Setup del Entorno (paso a paso)

### Paso 1 — Requisitos previos
- Node.js LTS v20.x o v22.x — descargar en https://nodejs.org
- Git instalado
- VS Code recomendado
- Extensiones VS Code recomendadas: ESLint, Prettier, Tailwind CSS IntelliSense, TypeScript

### Paso 2 — Clonar el repositorio

Pedir a José el link del repositorio en GitHub. Luego:

```bash
git clone https://github.com/[usuario]/logipyme-frontend.git
cd logipyme-frontend
```

### Paso 3 — Instalar dependencias

```bash
npm install
```

### Paso 4 — Crear el archivo de variables de entorno

Crear un archivo `.env.development` en la raíz del proyecto (al lado de `package.json`):

```env
VITE_API_URL=http://localhost:8080/api
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_APP_NAME=LogiPyme
```

> ⚠️ Este archivo **NO** se sube al repositorio (está en `.gitignore`). Cada desarrollador lo crea en su máquina.

### Paso 5 — Levantar el proyecto

```bash
npm run dev
```

La app corre en `http://localhost:3000`. El backend de José debe estar corriendo en `http://localhost:8080`.

---

## 6. Estructura de Carpetas

```
src/
├── components/
│   ├── layout/         ← AppShell, Sidebar, TopBar (NO TOCAR)
│   ├── shared/         ← StatusBadge, StatsCard, PageHeader reutilizables
│   └── ui/             ← Componentes Shadcn/UI
├── features/
│   ├── auth/           ← Landing, Login, Register (NO TOCAR)
│   ├── dashboard/      ← JOSE
│   ├── orders/         ← JOSE (OrdersList, OrderDetail, NewOrder)
│   ├── settings/       ← JOSE
│   ├── driver/         ← WILMER — crear esta carpeta
│   │   └── pages/
│   │       ├── DriverHomePage.tsx
│   │       └── DriverStopPage.tsx
│   ├── superadmin/     ← WILMER — crear esta carpeta
│   │   └── pages/
│   │       ├── SuperAdminDashboardPage.tsx
│   │       ├── PaymentQueuePage.tsx
│   │       └── TenantsPage.tsx
│   └── tracking/       ← WILMER — crear esta carpeta
│       └── pages/
│           └── PublicTrackingPage.tsx
├── lib/
│   └── axios.ts        ← Cliente HTTP (NO TOCAR)
├── router/
│   └── index.tsx       ← Rutas (solo agregar imports y reemplazar ComingSoon)
├── store/
│   └── authStore.ts    ← Estado de autenticación (NO TOCAR)
└── types/
    └── enums.ts        ← Enums del sistema (NO TOCAR)
```

---

## 7. Flujo de Trabajo con Git

### Ramas

| Rama | Uso |
|---|---|
| `main` | Producción. Solo via PR aprobado |
| `develop` | Integración. Fusionan los PRs |
| `feature/wilmer-*` | Tus features nuevos |
| `fix/wilmer-*` | Tus correcciones de bugs |

### Flujo diario

```bash
# 1. Actualizar develop antes de trabajar
git checkout develop
git pull origin develop

# 2. Crear tu rama para la feature
git checkout -b feature/wilmer-tracking-publico

# 3. Trabajar, hacer commits
git add .
git commit -m "feat(tracking): agregar página de tracking público"

# 4. Subir tu rama y hacer Pull Request a develop
git push origin feature/wilmer-tracking-publico
```

### Formato de commits (Conventional Commits)
```
feat(tracking): agregar página de tracking público
feat(driver): implementar lista de paradas
feat(superadmin): dashboard global con métricas
fix(driver): corregir sincronización offline
```

---

## 8. Autenticación y Cliente HTTP

### Cómo usar el cliente HTTP

El archivo `src/lib/axios.ts` ya tiene todo configurado. Solo importarlo y usarlo:

```typescript
import { api } from '@/lib/axios'

// GET
const { data } = await api.get('/tracking/TRK-1001')

// POST
const { data } = await api.post('/auth/login', { email, password })
```

> El interceptor adjunta el JWT automáticamente en rutas protegidas. No tienes que agregar el header manualmente.

### Cómo leer el usuario autenticado

```typescript
import { useAuthStore } from '@/store/authStore'

const { user, clearAuth } = useAuthStore()
// user.role, user.nombre, user.email, user.tenantId
```

---

## 9. Contratos de API para Wilmer

### Tracking público — `GET /api/tracking/{trackingCode}`

```json
{
  "trackingCode": "TRK-1001",
  "currentStatus": "IN_TRANSIT",
  "history": [
    { "status": "CREATED",    "changedAt": "2026-03-14T09:30:00" },
    { "status": "IN_TRANSIT", "changedAt": "2026-03-14T12:10:00" }
  ],
  "driverFirstName": "Carlos",
  "eta": "2026-03-14T18:00:00"
}
```

### Rutas del chofer — `GET /api/logistics/routes/assigned`

```json
[{
  "routeId": "f91a9cd7-...",
  "status": "PLANNED",
  "stops": [{
    "orderId": "905e2c41-...",
    "stopOrder": 1,
    "trackingCode": "TRK-1001",
    "status": "IN_TRANSIT",
    "eta": "2026-03-14T18:00:00"
  }]
}]
```

### Paquete offline — `GET /api/logistics/routes/{routeId}/offline-packet`

```json
{
  "routeId": "f91a9cd7-...",
  "status": "IN_PROGRESS",
  "stops": [{
    "orderId": "905e2c41-...",
    "stopOrder": 1,
    "trackingCode": "TRK-1001",
    "status": "IN_TRANSIT",
    "normalizedAddress": "Av. Siempre Viva 742, Springfield",
    "normalizationConfidence": 0.93
  }]
}
```

### Sync offline — `POST /api/logistics/routes/{routeId}/sync`

```json
{
  "deviceId": "uuid-del-dispositivo",
  "events": [{
    "clientEventId": "evt-20260314-001",
    "eventType": "STATUS_CHANGE",
    "orderId": "905e2c41-...",
    "targetStatus": "DELIVERED",
    "eventOccurredAt": "2026-03-14T16:40:00"
  }]
}
```

---

## 10. Patrones de Código a Seguir

### Cómo crear una página nueva

**Ejemplo:** crear la página de Tracking Público

1. Crear el archivo: `src/features/tracking/pages/PublicTrackingPage.tsx`

2. Estructura base:

```typescript
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'

const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"

export default function PublicTrackingPage() {
  const { orderId } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['tracking', orderId],
    queryFn: () => api.get(`/tracking/${orderId}`).then(r => r.data),
  })

  if (isLoading) return <div>Cargando...</div>

  return <div style={{ fontFamily: F }}>{/* tu JSX aquí */}</div>
}
```

3. Registrar en el router (`src/router/index.tsx`): buscar la línea que dice `ComingSoon` para tu página y reemplazar por el import real.

### Orden de imports en cada archivo

```typescript
// 1. Imports de librerías externas
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package } from 'lucide-react'

// 2. Imports internos con alias @/
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { StatusBadge } from '@/components/shared'

// 3. Tipos del componente
interface Props { ... }

// 4. Componente (hooks → efectos → handlers → early returns → render)
export default function MiPagina() { ... }
```

### Componente `StatusBadge` ya hecho

Para mostrar estados de órdenes, rutas, vehículos o tenants, ya existe el componente listo:

```typescript
import { StatusBadge } from '@/components/shared'

// Uso:
<StatusBadge status="IN_TRANSIT" />
<StatusBadge status="DELIVERED" size="sm" />
```

Soporta todos estos valores: `CREATED`, `ASSIGNED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`, `DRAFT`, `IN_PROGRESS`, `COMPLETED`, `PENDING_VALIDATION`, `APPROVED`, `REJECTED`, `DISPONIBLE`, `EN_RUTA`, `MANTENIMIENTO`, `TRIAL`, `ACTIVE`, `SUSPENDED`.

---

## 11. Manejo de Errores HTTP

| Código | Significado | Qué mostrar |
|---|---|---|
| 401 | Token inválido / expirado | Redirigir a login |
| 403 | Sin permisos de rol | Pantalla "Sin acceso" |
| 404 | Recurso no existe | Estado vacío + botón volver |
| 409 | Conflicto de negocio | Mensaje funcional + refresh |
| 400 | Validación fallida | Marcar campos con error |

---

## 12. Notas Clave: Vista del Chofer (PWA)

> ⚠️ **La vista del chofer es el corazón del producto.** Si el chofer no puede marcar una entrega sin internet, el negocio se cae. Prioriza que el offline funcione perfecto.

- Diseño **mobile-first** (375px mínimo de ancho)
- **Sin sidebar** — layout propio y simplificado, diferente al AppShell
- Debe funcionar offline por al menos **8 horas**
- Al reconectar, sincronizar eventos en **orden cronológico**
- Las fotos de PoD deben **comprimirse a máx 500KB** antes de subir (usar `canvas` client-side)
- Usar **IndexedDB** con la librería `idb` para guardar eventos offline
- Incluir un `SyncBanner` visible que muestre si hay conexión o no

### Flujo offline del chofer

```
1. Al abrir la app con conexión → descargar offline-packet
2. Chofer sale a ruta → puede perder conexión
3. Marca entregas offline → se guardan en IndexedDB
4. Al reconectar → sincronizar con POST /sync
5. Si hay conflictos → mostrar UI de resolución
```

---

## 13. Notas sobre el SuperAdmin

El SuperAdmin no pertenece a ningún tenant (`tenantId = null`). Sus páginas muestran datos globales de **todos** los tenants. Los pagos de suscripción se validan manualmente porque no hay API bancaria en Venezuela — el SuperAdmin revisa la foto del comprobante y aprueba o rechaza.

### Estados de tenants
- `TRIAL` → 7 días de acceso gratuito
- `ACTIVE` → Pago aprobado, acceso completo
- `SUSPENDED` → Sin pago vigente
- `CANCELLED` → Dado de baja

---

## 14. Reglas de Validación en Formularios

Aplica estas reglas en todos los inputs que crees:

| Campo | Regla |
|---|---|
| Nombre / Apellido | Solo letras con acento y espacios. Sin números ni caracteres especiales (`-`, `'`, `.`). Máx 30 caracteres. |
| Email | Máx 50 caracteres. Formato email estándar. |
| Teléfono venezolano | Solo números. Máx 10 dígitos (sin el +58). |
| Monto en $ | Solo números, punto o coma decimal. Sin negativos. Sin spinner numérico. |
| RIF venezolano | Primera letra solo `J`, `V`, `E`, `G` o `C`. Luego guión y números. Máx 12 caracteres. Auto-uppercase. |
| Dirección | Máx 200 caracteres. |
| Notas de entrega | Máx 300 caracteres. |
| Contraseñas | Mínimo 8, máximo 64 caracteres. |
| Búsqueda en tablas | Máx 30-50 caracteres según contexto. |

---

## 15. Checklist de Verificación

### Setup inicial
- [ ] Node.js 20+ instalado (`node --version`)
- [ ] Repositorio clonado correctamente
- [ ] `npm install` sin errores
- [ ] `.env.development` creado con las 3 variables
- [ ] `npm run dev` levanta en `http://localhost:3000` sin errores
- [ ] Login funciona con usuario de prueba

> **Login temporal para desarrollo** (sin backend corriendo): ir a DevTools → Application → Local Storage → `http://localhost:3000` → crear clave `auth-storage` con este valor:
> ```json
> {"state":{"user":{"id":"test-001","email":"admin@logipyme.com","nombre":"Ana","apellido":"Pérez","role":"ADMIN_PYME","tenantId":"tenant-001"},"accessToken":"fake-token-dev"},"version":0}
> ```

### Por cada página que entregues
- [ ] La ruta protegida verifica el rol correcto
- [ ] Los estados loading/error están manejados visualmente
- [ ] Se ve bien en desktop y mobile (probar en Chrome DevTools → modo móvil 375px)
- [ ] No hay errores en consola del navegador
- [ ] Commit con mensaje en formato Conventional Commits
- [ ] Font size mínimo 15px en todos los textos visibles

---

*Cualquier duda, hablar con José antes de asumir. ¡Éxito Wilmer!*