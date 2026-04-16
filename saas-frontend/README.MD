# LogiPyme — Frontend

SaaS de micro-logística para PYMEs venezolanas. Este repositorio contiene el frontend completo construido sobre React + Vite + TypeScript.

## Stack

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18+ | Framework UI |
| Vite | 5+ | Bundler |
| TypeScript | 5+ | Tipado |
| Tailwind CSS | 3+ | Estilos |
| Shadcn/UI | latest | Componentes |
| TanStack Query | 5+ | Server state |
| Zustand | 4+ | Client state |
| React Router | 6+ | Navegación |
| Axios | 1+ | HTTP client |
| Leaflet | latest | Mapas |

## Setup rápido

```bash
# 1. Clonar
git clone https://github.com/[usuario]/logipyme-frontend.git
cd logipyme-frontend

# 2. Instalar dependencias
npm install

# 3. Variables de entorno
cp .env.example .env.development
# Editar .env.development con tus valores locales

# 4. Levantar
npm run dev
# → http://localhost:3000
```

## Variables de entorno

Crear `.env.development` en la raíz:

```env
VITE_API_URL=http://localhost:8080/api
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_APP_NAME=LogiPyme
```

> ⚠️ Este archivo **no se sube al repo**. Cada developer lo crea localmente.

## División de trabajo

| Página | Ruta | Dev |
|---|---|---|
| Landing | `/` | José |
| Login | `/login` | José |
| Dashboard Admin | `/app/dashboard` | José |
| Lista de órdenes | `/app/orders` | José |
| Nueva orden | `/app/orders/new` | José |
| Detalle de orden | `/app/orders/:id` | José |
| Rutas | `/app/routes` | José |
| Flota | `/app/fleet` | José |
| Usuarios | `/app/users` | José |
| Facturación | `/app/billing` | José |
| **Tracking público** | `/tracking/:orderId` | **Wilmer** |
| **Home Chofer** | `/app/driver` | **Wilmer** |
| **Detalle parada** | `/app/driver/stop/:id` | **Wilmer** |
| **Dashboard SuperAdmin** | `/app/superadmin` | **Wilmer** |
| **Cola de pagos** | `/app/superadmin/payments` | **Wilmer** |
| **Gestión de tenants** | `/app/superadmin/tenants` | **Wilmer** |

## Flujo de Git

```
main          ← producción (solo via PR aprobado)
  └── develop ← integración
        ├── feature/jose-*
        └── feature/wilmer-*
```

```bash
# Crear tu rama
git checkout develop && git pull origin develop
git checkout -b feature/wilmer-tracking-publico

# Commits
git commit -m "feat(tracking): agregar página de tracking público"

# PR
git push origin feature/wilmer-tracking-publico
# → abrir PR en GitHub hacia develop
```

## Estructura de carpetas

```
src/
├── components/
│   ├── layout/       ← AppShell, Sidebar, TopBar
│   ├── shared/       ← Componentes reutilizables
│   └── ui/           ← Shadcn/UI
├── features/
│   ├── auth/         ← Landing, Login, Register
│   ├── dashboard/    ← JOSÉ
│   ├── orders/       ← JOSÉ
│   ├── driver/       ← WILMER
│   ├── superadmin/   ← WILMER
│   ├── tracking/     ← WILMER
│   └── settings/
├── lib/
│   └── axios.ts      ← Cliente HTTP con interceptores JWT
├── router/
│   └── index.tsx     ← Todas las rutas
├── store/
│   └── authStore.ts  ← Estado de auth (Zustand)
└── types/
    └── enums.ts      ← Role, OrderStatus, etc.
```

## Roles del sistema

```ts
enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_PYME  = 'ADMIN_PYME',
  DESPACHADOR = 'DESPACHADOR',
  CHOFER      = 'CHOFER',
}
```

## Onboarding completo

Ver el archivo `Onboarding_Wilmer_LogiPyme.docx` para la guía detallada de setup, contratos de API y patrones de código.