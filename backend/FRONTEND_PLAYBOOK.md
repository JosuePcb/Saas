# FRONTEND PLAYBOOK (Integracion con Backend SaaS)

## 1) Objetivo y alcance

- Este playbook cubre **solo integracion frontend** contra un backend ya construido en Spring Boot.
- No incluye cambios de API, modelos de base de datos ni permisos del backend.
- Meta: dejar una app frontend operativa con autenticacion, autorizacion por rol, tracking y flujo offline/sync.
- Prioriza entrega incremental: primero flujos criticos, luego mejoras UX.
- Regla base: si falta dato de contrato, verificar endpoint real antes de asumir.

## 2) Preparacion del entorno

### 2.1 Requisitos locales

- Node.js LTS (recomendado 20.x o 22.x) y npm/pnpm/bun segun tu stack.
- Navegador con DevTools y soporte Service Worker (si haras offline real).
- Backend corriendo localmente (por defecto en `http://localhost:8080`).

### 2.2 Variables de entorno frontend

Define al menos:

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_ENV=local
VITE_AUTH_STORAGE=session
```

Notas:

- En Next.js usa `NEXT_PUBLIC_API_BASE_URL` en lugar de `VITE_API_BASE_URL`.
- `VITE_AUTH_STORAGE=session` sugiere persistir acceso corto; evita `localStorage` si no es necesario.

### 2.3 Cliente HTTP base

- Crear instancia unica (`apiClient`) con `baseURL = ${API_BASE_URL}/api`.
- Timeout inicial sugerido: 10s para online y 20s para sync.
- Default headers: `Content-Type: application/json`.
- Adjuntar `Authorization: Bearer <accessToken>` solo en rutas protegidas.

## 3) Dia 1 checklist (levantar app + smoke checks)

- [ ] Instalar dependencias y levantar frontend en modo dev.
- [ ] Confirmar `GET /api/logistics/health` devuelve `200`.
- [ ] Probar login con usuario valido (`POST /api/auth/login`).
- [ ] Verificar que token se adjunta y `GET /api/users` responde segun rol.
- [ ] Abrir pagina publica de tracking y consultar `GET /api/public/tracking/{trackingCode}` (canonico).
- [ ] Confirmar compatibilidad con endpoint legado `GET /api/tracking/{trackingCode}` solo si aplica.
- [ ] Simular expiracion de access token y confirmar refresh automatico.
- [ ] Verificar manejo visual de errores 401/403/404/409/400.

## 4) Implementacion de auth (paso a paso)

### 4.1 Login

Endpoint: `POST /api/auth/login`

```json
{
  "email": "admin@acme.com",
  "password": "Admin123!"
}
```

Respuesta esperada:

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "f4f3b4a2-2c5f-4ea0-91e0-f8b6e64ab8a1",
    "email": "admin@acme.com",
    "nombre": "Ana",
    "apellido": "Lopez",
    "role": "ADMIN_PYME",
    "activo": true
  }
}
```

### 4.2 Estrategia de almacenamiento de tokens

- Recomendado: `accessToken` en memoria + `refreshToken` en `sessionStorage` (no en estado global persistente largo).
- Al recargar pagina: rehidratar `refreshToken`, pedir refresh, y reconstruir sesion.
- Si refresh falla, limpiar estado y redirigir a login.

### 4.3 Flujo de refresh

Endpoint: `POST /api/auth/refresh`

```json
{ "refreshToken": "eyJ..." }
```

- Ejecutar refresh cuando un request protegido responde `401`.
- Evitar tormenta de refresh: usar estrategia **single-flight** (una sola llamada en curso).
- Reintentar request original una vez luego de refresh exitoso.
- Si segundo intento vuelve a fallar con 401: logout forzado.

### 4.4 Comportamiento de interceptores (axios/fetch)

- Request interceptor: inyecta bearer token si existe.
- Response interceptor:
  - `401`: intenta refresh (excepto si endpoint ya es `/auth/login` o `/auth/refresh`).
  - `403`: no refrescar; mostrar "sin permisos".
  - `>=500`: notificacion de error temporal y opcion de reintento.
- Marcar requests con flag `_retry` para prevenir loops infinitos.

## 5) Guardias de ruta por rol

Mapa recomendado:

- `public`: `/login`, `/tracking/:trackingCode`.
- `SUPER_ADMIN`: secciones globales (ej. administracion de pagos globales).
- `ADMIN_PYME`: usuarios de tenant, billing del tenant, logistica admin.
- `DESPACHADOR`: tracking operativo, ordenes, rutas y vehiculos.
- `CHOFER`: rutas asignadas, paquete offline, sync de eventos.

Regla UX:

- Usuario autenticado sin rol permitido -> pantalla 403 (no redirigir a login).
- Usuario no autenticado -> redireccion a login con `returnTo`.

## 6) Orden sugerido de implementacion de features

1. **Pagina publica de tracking** (`GET /api/public/tracking/{trackingCode}`): endpoint canonico sin auth.
2. **Vista tracking despachador** (`GET /api/logistics/orders/dispatcher-tracking`).
3. **Rutas asignadas chofer** (`GET /api/logistics/routes/assigned`, start/complete chofer).
4. **Consumo de paquete offline** (`GET /api/logistics/routes/{id}/offline-packet`).
5. **Subida de sync** (`POST /api/logistics/routes/{id}/sync`) con cola robusta.
6. **Normalizacion de direcciones + optimizacion IA** (ver seccion 7.6): integrar preview/confirm y correccion manual.
7. **Panel superadmin de tenants** (ver seccion 7.7): listar tenants, metricas, suspender/reactivar.

## 7) API contracts quick-reference (JSON concreto)

### 7.1 Tracking publico

`GET /api/public/tracking/TRK-1001` (canonico)

Compatibilidad legado: `GET /api/tracking/TRK-1001`

```json
{
  "trackingCode": "TRK-1001",
  "currentStatus": "IN_TRANSIT",
  "history": [
    { "status": "CREATED", "changedAt": "2026-03-14T09:30:00" },
    { "status": "IN_TRANSIT", "changedAt": "2026-03-14T12:10:00" }
  ],
  "driverFirstName": "Carlos",
  "eta": "2026-03-14T18:00:00"
}
```

### 7.2 Tracking operativo despachador

`GET /api/logistics/orders/dispatcher-tracking`

```json
{
  "orders": [
    {
      "orderId": "905e2c41-4d9b-4f6e-9f6d-793bf9ecf1a1",
      "trackingCode": "TRK-1001",
      "status": "IN_TRANSIT",
      "routeId": "f91a9cd7-5b93-45b8-b1dc-2b10f4bbd0a5",
      "lastStatusTimestamp": "2026-03-14T12:10:00"
    }
  ]
}
```

### 7.3 Rutas asignadas chofer

`GET /api/logistics/routes/assigned`

```json
[
  {
    "routeId": "f91a9cd7-5b93-45b8-b1dc-2b10f4bbd0a5",
    "vehicleId": "f151f5db-2f73-4ff4-b9bc-dbc86893e839",
    "status": "PLANNED",
    "createdAt": "2026-03-14T08:00:00",
    "stops": [
      {
        "orderId": "905e2c41-4d9b-4f6e-9f6d-793bf9ecf1a1",
        "stopOrder": 1,
        "trackingCode": "TRK-1001",
        "status": "IN_TRANSIT",
        "eta": "2026-03-14T18:00:00"
      }
    ]
  }
]
```

### 7.4 Paquete offline chofer

`GET /api/logistics/routes/{routeId}/offline-packet`

```json
{
  "routeId": "f91a9cd7-5b93-45b8-b1dc-2b10f4bbd0a5",
  "vehicleId": "f151f5db-2f73-4ff4-b9bc-dbc86893e839",
  "status": "IN_PROGRESS",
  "generatedAt": "2026-03-14T13:00:00",
  "stops": [
    {
      "orderId": "905e2c41-4d9b-4f6e-9f6d-793bf9ecf1a1",
      "stopOrder": 1,
      "trackingCode": "TRK-1001",
      "status": "IN_TRANSIT",
      "normalizedAddress": "Av. Siempre Viva 742, Springfield",
      "normalizationConfidence": 0.93,
      "normalizationFallbackUsed": false
    }
  ]
}
```

### 7.5 Subida de sync offline

`POST /api/logistics/routes/{routeId}/sync`

```json
{
  "deviceId": "b11a4a99-c1dc-4a6f-b0c9-38d357de2de0",
  "events": [
    {
      "clientEventId": "evt-20260314-001",
      "eventType": "STATUS_CHANGE",
      "orderId": "905e2c41-4d9b-4f6e-9f6d-793bf9ecf1a1",
      "targetStatus": "DELIVERED",
      "eventOccurredAt": "2026-03-14T16:40:00"
    }
  ]
}
```

Respuesta:

```json
{
  "processedEvents": 1,
  "acceptedEvents": 1,
  "duplicateEvents": 0,
  "conflictEvents": 0
}
```

### 7.6 IA: normalizacion de direcciones y optimizacion de rutas

Endpoints vigentes:

- `POST /api/ai/address-normalizations/{orderId}`
- `POST /api/ai/address-normalizations/{orderId}/manual-correction`
- `GET /api/ai/address-normalizations/{orderId}/attempts/latest`
- `POST /api/ai/address-normalizations/routes/optimization/preview`
- `POST /api/ai/address-normalizations/routes/optimization/confirm`

Contrato frontend (alto nivel):

- `.../{orderId}`: dispara normalizacion IA para la orden.
- `.../{orderId}/manual-correction`: envia correccion manual cuando la normalizacion automatica no es aceptable.
- `.../{orderId}/attempts/latest`: consulta el ultimo intento para pintar estado/confianza en UI.
- `.../preview`: calcula propuesta de optimizacion sin confirmar cambios definitivos.
- `.../confirm`: confirma y persiste la optimizacion seleccionada.

Importante:

- No asumir campos de request/response para estos endpoints: **consultar Swagger**.
- Politica actual de IA: **solo Gemini** (sin fallback a otros proveedores).

### 7.7 Superadmin: panel de tenants

Endpoints vigentes (`SUPER_ADMIN`):

- `GET /api/admin/tenants`
- `GET /api/admin/tenants/metrics`
- `POST /api/admin/tenants/{tenantId}/suspend`
- `POST /api/admin/tenants/{tenantId}/reactivate`

Contrato frontend (alto nivel):

- `GET /tenants`: listado para tabla principal de tenants.
- `GET /tenants/metrics`: cards/resumen agregados del panel.
- `POST /suspend` y `POST /reactivate`: acciones operativas por tenant.

Importante:

- Estas rutas son exclusivas de `SUPER_ADMIN`; ocultar UI para otros roles y manejar `403`.
- Si necesitas payload exacto de acciones `suspend/reactivate`: **consultar Swagger**.

## 8) Algoritmo de sync offline

- Mantener cola local persistente (`pendingEvents`) ordenada por `eventOccurredAt`.
- Generar `clientEventId` unico por evento (UUID o timestamp+counter) antes de encolar.
- Dedupe local: no encolar si ya existe mismo `clientEventId`.
- Batch upload: enviar en bloques (p.ej. 20 eventos) por ruta.
- Si respuesta indica duplicados: marcar como sincronizados y remover de cola.
- Reintentos con backoff exponencial (2s, 4s, 8s, max 60s) + jitter.
- Si `conflictEvents > 0`: mostrar UI de conflicto por pedido (estado local vs estado servidor) y permitir reintento/manual override segun negocio.

## 9) Matriz de manejo de errores

- `401 Unauthorized`: token invalido/expirado. Accion: refresh o logout.
- `403 Forbidden`: usuario autenticado sin permiso de rol. Accion: pantalla 403 + CTA volver.
- `404 Not Found`: recurso inexistente o fuera de alcance. Accion: estado vacio + opcion volver/listado.
- `409 Conflict`: regla de negocio incumplida (estado incompatible, conflicto sync). Accion: mensaje funcional y refrescar datos.
- `400 Bad Request`: validacion. Accion: mapear `fieldErrors` del backend a form.

Error backend estandar:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/logistics/routes/123/sync",
  "timestamp": "2026-03-14T14:10:00",
  "fieldErrors": [
    { "field": "events[0].clientEventId", "message": "Client event id is required" }
  ]
}
```

## 10) Checklist de QA + PR

- [ ] Login, refresh, logout y session restore probados manualmente.
- [ ] Guardias por rol probadas con usuarios reales de cada rol.
- [ ] Flujos publicos no requieren token ni filtran datos sensibles.
- [ ] Offline: modo avion, encolar eventos, reconectar y sincronizar.
- [ ] Retries/backoff sin loops infinitos ni duplicacion de requests.
- [ ] Errores 400/401/403/404/409 renderizados con UX clara.
- [ ] PR incluye evidencias (capturas/gif/logs) para escenarios clave.

## 11) Pitfalls comunes y debug rapido

- **Base URL mal configurada**: revisar `API_BASE_URL` y que el cliente use `/api`.
- **Refresh en loop**: verificar exclusiones de `/auth/login` y `/auth/refresh` en interceptor.
- **403 inesperado**: inspeccionar `user.role` del login y mapa de guardias frontend.
- **CORS/Network Error**: revisar consola navegador + pestaña Network + backend levantado.
- **Eventos sync rechazados**: validar `clientEventId` unico, `eventType`, `orderId`, `targetStatus` y formato de `eventOccurredAt`.
- **Desfase visual en tracking**: invalidar cache local tras cambios de estado y reconsultar endpoint fuente.
- **Tracking publico inconsistente**: usar primero endpoint canonico `/api/public/tracking/{trackingCode}`; mantener legado solo por compatibilidad.
- **IA sin respuesta esperada**: validar contratos en Swagger y recordar politica Gemini-only.
