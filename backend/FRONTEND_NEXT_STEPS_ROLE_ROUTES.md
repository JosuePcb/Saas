# FRONTEND: siguientes pasos por rutas y roles

Este documento define un plan de implementacion frontend, paso a paso, para conectar una app web/movil con los contratos actuales del backend (RBAC + multi-tenant + tracking publico + IA + sync offline).

> Regla operativa: **no suponer payload: validar en Swagger** (`/swagger-ui.html`) antes de cerrar cada pantalla.

## 1) Preparacion inicial (base tecnica)

1. Definir `API_BASE_URL` por entorno (`dev`, `staging`, `prod`) y centralizar un cliente HTTP unico.
2. Implementar interceptores:
   - `Authorization: Bearer <accessToken>` para rutas privadas.
   - Manejo de `401` -> intentar refresh una sola vez.
   - Manejo de `403` -> mostrar vista de permisos insuficientes.
3. Crear capa `authStore` (o equivalente):
   - `accessToken`, `refreshToken`, `user`, `role`, `tenantId`.
   - Estado de sesion (`authenticated`, `anonymous`, `refreshing`).
4. Agregar parser de JWT en frontend solo para UX/guards (nunca para seguridad real): leer `role`, `tenant_id`, `sub`.
5. Configurar cliente para errores estandar del backend (`status`, `error`, `message`, `fieldErrors`).

## 2) Flujo de autenticacion minimo

Endpoints base:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

Pasos:
1. Pantallas publicas: registro y login.
2. Al login/registro exitoso, guardar `accessToken` + `refreshToken` + perfil de usuario (`AuthResponse`).
3. Implementar rotacion silenciosa: cuando expire access token, llamar `/api/auth/refresh` y actualizar ambos tokens.
4. Si refresh falla, limpiar sesion y redirigir a `/login`.
5. Mostrar estado tenant cuando aplique (si backend devuelve suspension/cancelacion en login, mensaje claro + CTA soporte).

## 3) Guards y layout por rol

Crear guardas de navegacion por rol:
- `SUPER_ADMIN`
- `ADMIN_PYME`
- `DESPACHADOR`
- `CHOFER`
- Publico (sin login)

Recomendacion de estructura:
- `PublicLayout` (login/register/tracking publico)
- `SuperAdminLayout` (`/superadmin/*`)
- `TenantOpsLayout` (`/app/*` para admin/despachador)
- `DriverLayout` (`/driver/*` para chofer)

Reglas:
1. Si no hay token y ruta privada -> login.
2. Si hay token pero rol no permitido -> 403 page interna.
3. Si usuario `SUPER_ADMIN`, ocultar rutas tenant-operativas por defecto.
4. Si usuario tenant (`ADMIN_PYME`, `DESPACHADOR`, `CHOFER`), no exponer UI de `/api/admin/**`.

## 4) Mapa de rutas frontend recomendadas

### Publicas
- `/login`
- `/registro`
- `/tracking/:trackingCode` (consulta publica, soportar endpoint canonico + legacy)

### SuperAdmin
- `/superadmin/tenants`
- `/superadmin/tenants/:tenantId`
- `/superadmin/metrics`
- `/superadmin/payments/review`

### Admin PyME / Despachador
- `/app/dashboard`
- `/app/users`
- `/app/vehicles`
- `/app/orders`
- `/app/orders/:id`
- `/app/orders/:id/pod`
- `/app/routes`
- `/app/routes/:id`
- `/app/dispatcher-tracking`
- `/app/ai/address-normalization`
- `/app/ai/route-optimization`
- `/app/billing/payments` (ADMIN_PYME)

### Chofer
- `/driver/routes`
- `/driver/routes/:id`
- `/driver/routes/:id/offline`
- `/driver/sync-status`

## 5) Matriz ruta -> endpoint por rol

## Nota de contrato
- Tracking publico existe en dos contratos: canonico y legacy.
- Conviene consumir canonico primero y dejar fallback al legacy.

| Rol | Ruta frontend | Endpoint backend | Metodo | Notas |
|---|---|---|---|---|
| Publico | `/tracking/:trackingCode` | `/api/public/tracking/{trackingCode}` | GET | Canonico |
| Publico | `/tracking/:trackingCode` | `/api/tracking/{trackingCode}` | GET | Legacy fallback |
| SUPER_ADMIN | `/superadmin/tenants` | `/api/admin/tenants` | GET | Filtro `status` opcional |
| SUPER_ADMIN | `/superadmin/metrics` | `/api/admin/tenants/metrics` | GET | KPIs globales |
| SUPER_ADMIN | Tenant detail actions | `/api/admin/tenants/{tenantId}/suspend` | POST | Requiere `reason` |
| SUPER_ADMIN | Tenant detail actions | `/api/admin/tenants/{tenantId}/reactivate` | POST | Requiere `reason` |
| SUPER_ADMIN | `/superadmin/payments/review` | `/api/admin/billing/payments` | GET | Cola de revision |
| SUPER_ADMIN | Payment decision | `/api/admin/billing/payments/{paymentId}/decision` | POST | Aprobar/rechazar |
| ADMIN_PYME | `/app/users` | `/api/users` | GET/POST | Gestion usuarios tenant |
| ADMIN_PYME | `/app/users/:id` | `/api/users/{id}` | GET/PUT/DELETE | CRUD usuario |
| ADMIN_PYME, DESPACHADOR | `/app/vehicles` | `/api/logistics/vehicles` | GET/POST | Flota tenant |
| ADMIN_PYME, DESPACHADOR | `/app/vehicles/:id` | `/api/logistics/vehicles/{id}` | GET/PUT/DELETE | Vehiculo |
| ADMIN_PYME, DESPACHADOR | `/app/orders` | `/api/logistics/orders` | POST | Crear orden basica |
| ADMIN_PYME, DESPACHADOR | `/app/orders/:id` | `/api/logistics/orders/{id}/status` | PATCH | Cambio estado |
| ADMIN_PYME, DESPACHADOR | `/app/orders/:id` | `/api/logistics/orders/{id}/history` | GET | Historial inmutable |
| ADMIN_PYME, DESPACHADOR | `/app/dispatcher-tracking` | `/api/logistics/orders/dispatcher-tracking` | GET | Vista operativa |
| ADMIN_PYME, DESPACHADOR | `/app/orders/:id/pod` | `/api/logistics/orders/{id}/pod` | POST/GET | Upload + lectura metadata |
| ADMIN_PYME, DESPACHADOR | `/app/orders/:id/normalize` | `/api/logistics/orders/{id}/normalize-address` | POST | Normalizacion deterministica |
| ADMIN_PYME, DESPACHADOR | `/app/ai/address-normalization` | `/api/ai/address-normalizations/{orderId}` | POST | Flujo IA Gemini |
| ADMIN_PYME, DESPACHADOR | `/app/ai/address-normalization` | `/api/ai/address-normalizations/{orderId}/manual-correction` | POST | Correccion manual |
| ADMIN_PYME, DESPACHADOR | `/app/ai/address-normalization` | `/api/ai/address-normalizations/{orderId}/attempts/latest` | GET | Ultimo intento |
| ADMIN_PYME, DESPACHADOR | `/app/ai/route-optimization` | `/api/ai/address-normalizations/routes/optimization/preview` | POST | Preview ordenamiento |
| ADMIN_PYME, DESPACHADOR | `/app/ai/route-optimization` | `/api/ai/address-normalizations/routes/optimization/confirm` | POST | Confirmar y crear ruta |
| ADMIN_PYME, DESPACHADOR | `/app/routes` | `/api/logistics/routes` | POST | Crear ruta manual |
| ADMIN_PYME, DESPACHADOR | `/app/routes/:id` | `/api/logistics/routes/{id}/start` | POST | Iniciar |
| ADMIN_PYME, DESPACHADOR | `/app/routes/:id` | `/api/logistics/routes/{id}/complete` | POST | Completar |
| CHOFER | `/driver/routes` | `/api/logistics/routes/assigned` | GET | Rutas asignadas |
| CHOFER | `/driver/routes/:id` | `/api/logistics/routes/{id}/driver-start` | POST | Inicio chofer |
| CHOFER | `/driver/routes/:id` | `/api/logistics/routes/{id}/driver-complete` | POST | Cierre chofer |
| CHOFER | `/driver/routes/:id/offline` | `/api/logistics/routes/{id}/offline-packet` | GET | Payload offline |
| CHOFER | `/driver/routes/:id/offline` | `/api/logistics/routes/{id}/sync` | POST | Subida eventos sync |
| ADMIN_PYME | `/app/billing/payments` | `/api/billing/payments` | GET/POST | Pagos tenant |

> Repeticion intencional: **no suponer payload: validar en Swagger** para cada endpoint antes de cerrar forms y tipados.

## 6) Flujos clave que debes implementar

### A) SuperAdmin dashboard
1. Cargar `/api/admin/tenants/metrics` en la cabecera (KPIs).
2. Tabla de tenants con `/api/admin/tenants?status=`.
3. Acciones `Suspend` y `Reactivate` con modal de `reason` obligatorio.
4. Cola de pagos con `/api/admin/billing/payments` y decision approve/reject.
5. UX recomendada: invalidar caches dependientes tras cada decision/cambio de estado tenant.

### B) Admin PyME / Despachador operativo
1. Gestion de usuarios (`/api/users`) para rol admin.
2. Gestion de vehiculos.
3. Ordenes: crear, cambiar estado, historial.
4. Rutas: crear y transicionar (`start`, `complete`).
5. Tracking de despachador y PoD.

### C) Chofer y offline sync
1. Listar rutas asignadas.
2. Descargar `offline-packet` por ruta.
3. Permitir trabajo offline local (cola de eventos cliente con `clientEventId` unico).
4. Al volver red, enviar `/sync` por lote y mostrar resumen (`accepted`, `duplicates`, `conflicts`).
5. Si hay conflictos, presentar UI de reconciliacion "server wins" (backend ya aplica resolucion).

### D) IA (normalizacion + optimizacion)
1. Normalizacion por orden (`/api/ai/address-normalizations/{orderId}`).
2. Si `reviewStatus` indica revision manual, habilitar formulario de correccion.
3. Optimizacion de rutas:
   - `preview`
   - mostrar orden recomendado, distancia estimada, firma de preview
   - `confirm` usando exactamente la firma recibida.

## 7) Checklist de testing frontend

- Auth:
  - login valido/invalido
  - refresh exitoso y refresh fallido
  - expiracion de token en segundo plano
- RBAC:
  - cada rol entra solo a rutas permitidas
  - `403` renderiza vista correcta
- Tenant:
  - usuario tenant no ve data global superadmin
  - cambios de tenant status impactan UX de acceso
- Tracking publico:
  - probar codigo existente/no existente
  - fallback canonico -> legacy si aplica
- IA:
  - estados `AUTO_ACCEPTED`, `REVIEW_REQUIRED`, fallback
  - preview/confirm con firma invalida (debe fallar)
- Chofer offline:
  - sync con duplicados
  - sync con conflictos
  - sync ok post-reconexion

## 8) Orden sugerido de implementacion

1. Base tecnica: cliente HTTP + auth store + interceptores + guards.
2. Login/registro/refresh y layouts por rol.
3. Tracking publico (canonico + fallback legacy).
4. SuperAdmin (tenants + metrics + review pagos).
5. Admin/DESPACHADOR (users, vehicles, orders, routes).
6. Chofer (assigned/offline/sync).
7. IA (normalizacion + optimizacion preview/confirm).
8. Hardening: estados de error, retries, observabilidad frontend.

## 9) Criterios de "Done"

- Todas las rutas privadas tienen guard por rol y manejo de 401/403.
- Cada pantalla consume endpoint real del backend, sin mocks persistentes.
- Tipados DTO alineados con Swagger actualizado.
- Flujos criticos pasan checklist manual E2E por rol.
- Tracking publico funciona con contrato canonico y fallback legacy.
- Offline sync del chofer reporta `accepted/duplicates/conflicts` y no bloquea UI.
- Flujo IA completo: normalize -> (opcional manual) -> preview -> confirm.
- Documentado en README frontend como correr y validar escenarios.
