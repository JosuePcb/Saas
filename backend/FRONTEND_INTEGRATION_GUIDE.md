# Guia de Integracion Frontend - SaaS Logistics API

Guia practica y orientada a implementacion para integrar frontend web/mobile con este backend.

## 1) Auth flow (login + refresh) y manejo de tokens

### Endpoints publicos
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

### Payloads base
`POST /api/auth/login`
```json
{
  "email": "admin@empresa.com",
  "password": "MiClaveSegura123"
}
```

Respuesta (`AuthResponse`):
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<refresh-token>",
  "user": {
    "id": "4cf4e18b-8f97-4d9a-97ec-9c5f93af6f5f",
    "email": "admin@empresa.com",
    "nombre": "Ana",
    "apellido": "Perez",
    "role": "ADMIN_PYME",
    "activo": true
  }
}
```

`POST /api/auth/refresh`
```json
{
  "refreshToken": "<refresh-token-actual>"
}
```

### Recomendaciones de implementacion
- Access token expira en ~15 min (`app.jwt.access-token-expiration-ms=900000`).
- Refresh token expira en ~7 dias (`app.jwt.refresh-token-expiration-ms=604800000`).
- Guarda `accessToken` en memoria (store de sesion) y evita persistirlo.
- Guarda `refreshToken` en almacenamiento seguro de plataforma.
- Usa interceptor HTTP: ante `401`, intenta refresh una sola vez y reintenta request.
- Siempre reemplaza refresh token luego de `/api/auth/refresh` (rotacion activa).
- Si refresh falla con `401`, limpiar sesion y redirigir a login.

## 2) Roles y permisos por ruta

Roles disponibles:
- `SUPER_ADMIN`
- `ADMIN_PYME`
- `DESPACHADOR`
- `CHOFER`

Permisos efectivos (backend actual):
- Publico: `/api/auth/**`, `GET /api/public/tracking/{trackingCode}` (canonico), `GET /api/tracking/{trackingCode}` (legado).
- `SUPER_ADMIN`: `/api/admin/**`.
- `ADMIN_PYME`: `/api/users/**`, `/api/billing/payments`, endpoints logisticos de admin.
- `DESPACHADOR`: endpoints logisticos operativos (ordenes/rutas/vehiculos).
- `CHOFER`: `/api/logistics/routes/assigned`, `driver-start`, `driver-complete`, `offline-packet`, `sync`.

Nota de IA:
- Politica activa: integraciones de IA soportadas **solo con Gemini**.

Recomendacion frontend:
- Route guards por rol + ocultar acciones no permitidas en UI.
- Nunca confiar solo en UI: backend sigue siendo autoridad final.

## 3) Convenciones base de API

### Headers y content-type
- Protegidos: `Authorization: Bearer <accessToken>`.
- JSON: `Content-Type: application/json`.
- PoD upload: `multipart/form-data` con campo `file`.
- No enviar `tenantId` desde frontend (ni header, ni body, ni query).

### Contrato de error
Estructura estandar (`ErrorResponse`):
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "timestamp": "2026-03-14T12:00:00",
  "fieldErrors": [
    {
      "field": "email",
      "message": "Must be a valid email address"
    }
  ]
}
```

Errores de seguridad tambien pueden venir en formato corto:
```json
{ "status": 401, "error": "Unauthorized", "message": "Invalid or expired token" }
```
```json
{ "status": 403, "error": "Forbidden", "message": "Insufficient permissions" }
```

## 4) Endpoints clave por modulo (con ejemplos minimos)

### Identity
Rutas:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/users`
- `GET /api/users/{id}`
- `POST /api/users`
- `PUT /api/users/{id}`
- `DELETE /api/users/{id}`

Crear usuario (`CreateUserRequest`):
```json
{
  "email": "chofer@empresa.com",
  "password": "ChoferPass123",
  "nombre": "Luis",
  "apellido": "Rojas",
  "telefono": "+584141234567",
  "role": "CHOFER"
}
```

### Billing
Rutas:
- `POST /api/billing/payments`
- `GET /api/billing/payments?status=PENDING_VALIDATION`
- `GET /api/admin/billing/payments?status=PENDING_VALIDATION`
- `POST /api/admin/billing/payments/{paymentId}/decision`

Enviar pago (`CreatePaymentRequest`):
```json
{
  "method": "PAGO_MOVIL",
  "amount": 45.50,
  "referenceNumber": "PM-20260314-001",
  "paymentDateTime": "2026-03-14T10:30:00",
  "evidenceUrl": "https://cdn.miapp.com/evidence/pm-001.jpg"
}
```

Decision (`PaymentDecisionRequest`):
```json
{
  "decision": "APPROVE",
  "comment": "Pago validado"
}
```

### Logistics
Vehiculos:
- `POST /api/logistics/vehicles`
- `GET /api/logistics/vehicles`
- `GET /api/logistics/vehicles/{id}`
- `PUT /api/logistics/vehicles/{id}`
- `DELETE /api/logistics/vehicles/{id}`

Ordenes:
- `POST /api/logistics/orders` (sin body)
- `PATCH /api/logistics/orders/{id}/status`
- `GET /api/logistics/orders/{id}/history`
- `GET /api/logistics/orders/dispatcher-tracking`
- `POST /api/logistics/orders/{id}/pod` (`multipart/form-data`)
- `GET /api/logistics/orders/{id}/pod`

Rutas:
- `POST /api/logistics/routes`
- `POST /api/logistics/routes/{id}/start`
- `POST /api/logistics/routes/{id}/complete`
- `GET /api/logistics/routes/assigned`
- `POST /api/logistics/routes/{id}/driver-start`
- `POST /api/logistics/routes/{id}/driver-complete`
- `GET /api/logistics/routes/{id}/offline-packet`
- `POST /api/logistics/routes/{id}/sync`

Ejemplos minimos:

Cambio de estado de orden (`ChangeOrderStatusRequest`):
```json
{ "status": "IN_TRANSIT" }
```

Crear ruta (`CreateRouteRequest`):
```json
{
  "vehicleId": "f4a40a17-e15d-4a5f-a106-9f298ac08f29",
  "driverId": "ce0f0f86-8be7-44f9-8a4a-5f7fb17d0318",
  "orderIds": [
    "ecb6d6e8-f89e-4cd1-8a0d-c3b4b1f8f0c1"
  ]
}
```

IA (normalizacion y optimizacion):
- `POST /api/ai/address-normalizations/{orderId}`
- `POST /api/ai/address-normalizations/{orderId}/manual-correction`
- `GET /api/ai/address-normalizations/{orderId}/attempts/latest`
- `POST /api/ai/address-normalizations/routes/optimization/preview`
- `POST /api/ai/address-normalizations/routes/optimization/confirm`

Contrato alto nivel para frontend:
- `POST .../{orderId}`: solicitar normalizacion automatica de direccion por orden.
- `POST .../{orderId}/manual-correction`: enviar correccion manual cuando aplique.
- `GET .../{orderId}/attempts/latest`: consultar ultimo intento para estado en UI.
- `POST .../preview`: obtener propuesta de optimizacion sin aplicar cambios definitivos.
- `POST .../confirm`: confirmar y persistir propuesta seleccionada.

Para payloads exactos/request-response: **consultar Swagger**.

### Tracking publico
Ruta:
- `GET /api/public/tracking/{trackingCode}` (canonico)
- `GET /api/tracking/{trackingCode}` (legado/compatibilidad)

Respuesta minima (`PublicTrackingResponse`):
```json
{
  "trackingCode": "TRK-AB12CD34-20260314-0001",
  "currentStatus": "IN_TRANSIT",
  "history": [
    { "status": "CREATED", "changedAt": "2026-03-14T08:10:00" }
  ],
  "driverFirstName": "Luis",
  "eta": "2026-03-14T14:30:00"
}
```

### Offline sync (chofer)
Packet (`DriverOfflineRoutePacketResponse`) y sync:

`GET /api/logistics/routes/{id}/offline-packet` -> trae `routeId`, `vehicleId`, `status`, `generatedAt`, `stops[]`.

`POST /api/logistics/routes/{id}/sync` (`UploadRouteSyncRequest`):
```json
{
  "deviceId": "2b8f70cd-b40a-45f1-9e52-c9f5e24f3a3f",
  "events": [
    {
      "clientEventId": "evt-0001",
      "eventType": "STATUS_CHANGE",
      "orderId": "ecb6d6e8-f89e-4cd1-8a0d-c3b4b1f8f0c1",
      "targetStatus": "IN_TRANSIT",
      "eventOccurredAt": "2026-03-14T11:05:00"
    }
  ]
}
```

Respuesta (`RouteSyncUploadResponse`):
```json
{ "processedEvents": 1, "acceptedEvents": 1, "duplicateEvents": 0, "conflictEvents": 0 }
```

## 5) Caveats de tenant y seguridad

- `401`: sin token, token invalido/expirado, refresh invalido/reusado.
- `403`: autenticado pero sin permisos de rol.
- `404`: recurso no existe o no pertenece al tenant actual.
- El backend aísla por tenant desde JWT (`tenant_id`), no por dato enviado por cliente.
- No expongas UI para cambiar tenant en una sesion normal de usuario tenant.

## 6) Checklist de integracion offline chofer

- Descargar y cachear `offline-packet` al comenzar ruta.
- Persistir packet + cola local de eventos (IndexedDB/SQLite/AsyncStorage).
- Generar `clientEventId` unico por evento.
- Mantener `deviceId` estable por instalacion.
- Reintentar sync con backoff exponencial cuando no haya red.
- Tratar `duplicateEvents` como idempotencia aplicada correctamente.
- Tratar `conflictEvents` como `server wins` y refrescar vista desde backend.

Expectativa de idempotencia actual:
- Dedupe por `tenantId + deviceId + clientEventId`.
- No existe header `Idempotency-Key`; usa `clientEventId` bien.

## 7) Arquitectura frontend sugerida

Stack sugerido:
- React Router para navegacion/guards.
- TanStack Query para cache, retries, invalidaciones.
- Zustand para sesion (`accessToken`, usuario, rol) y estado UI.
- React Hook Form + Zod para formularios/errores tipados.

Estructura de carpetas sugerida:
```text
src/
  app/
    router/
    providers/
  shared/
    api/
      httpClient.ts
      authInterceptor.ts
      errorMapper.ts
    types/
    utils/
  modules/
    identity/{api,hooks,pages,store}
    billing/{api,hooks,pages}
    logistics/{api,hooks,pages}
    tracking/{api,pages}
    offline-sync/{queue,sync-engine,storage}
```

Mapeo backend -> frontend:
- `identity`: `/api/auth`, `/api/users`
- `billing`: `/api/billing/payments`, `/api/admin/billing/payments`
- `logistics`: `/api/logistics/orders|routes|vehicles`
- `tracking`: `/api/public/tracking/{trackingCode}` (usar por defecto), `/api/tracking/{trackingCode}` (fallback legado)
- `ai-normalization`: `/api/ai/address-normalizations/**`
- `superadmin-tenants`: `/api/admin/tenants`, `/api/admin/tenants/metrics`, `suspend/reactivate`
- `offline-sync`: `offline-packet`, `sync`

## 8) QA checklist antes de PR frontend

- Login/refresh/logout probado (incluye rotacion refresh token).
- Manejo de `401/403/404` consistente, sin loops de refresh.
- Route guards por rol funcionando.
- Flujos de identity, billing, logistics, tracking verificados.
- Tracking publico validado en endpoint canonico y, si aplica, en legado.
- Flujos IA (normalizacion, latest attempt, preview/confirm) validados contra Swagger.
- Panel superadmin de tenants validado (`list`, `metrics`, `suspend`, `reactivate`) con RBAC.
- Upload PoD validado (tipo permitido y tamano maximo).
- Offline chofer validado: packet, cola, reintentos, dedupe, conflictos.
- `fieldErrors` mapeado por campo en formularios.
- Invalidaciones de TanStack Query correctas tras mutaciones.
- Sin hardcode de tenant ni logs de tokens sensibles.

## Referencia rapida de enums

- `UserRole`: `SUPER_ADMIN`, `ADMIN_PYME`, `DESPACHADOR`, `CHOFER`
- `PaymentMethod`: `PAGO_MOVIL`, `TRANSFERENCIA`
- `PaymentStatus`: `PENDING_VALIDATION`, `APPROVED`, `REJECTED`
- `OrderStatus`: `CREATED`, `ASSIGNED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`
- `RouteStatus`: `DRAFT`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- `SyncEventType`: `STATUS_CHANGE`, `POD_UPLOADED`, `LOCATION_PING`
