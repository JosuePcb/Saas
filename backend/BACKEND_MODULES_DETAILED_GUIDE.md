# Guia detallada de modulos backend

Esta guia explica, de forma practica, que hace cada modulo del backend y como se conectan entre si en el flujo SaaS logistico multi-tenant.

Alcance:
- `core`
- `modules.identity`
- `modules.billing`
- `modules.logistics`
- `modules.tracking`
- `modules.ai`

Tambien cubre: JWT + refresh, aislamiento tenant, Flyway, offline sync/idempotencia, y politica Gemini-only.

---

## 1) Mapa mental rapido del sistema

- `identity` autentica usuarios, registra tenants y aplica RBAC base.
- `billing` recibe pagos de tenant y deja la decision final al superadmin.
- `logistics` opera pedidos, vehiculos, rutas, PoD y sync offline de chofer.
- `tracking` expone tracking publico canonico.
- `ai` normaliza direcciones y optimiza rutas (preview/confirm).
- `core` provee seguridad, contexto tenant, manejo de errores y storage.

Dos contratos publicos de tracking conviven:
- Canonico: `/api/public/tracking/{trackingCode}`
- Legacy: `/api/tracking/{trackingCode}`

---

## 2) core (security, tenant context, exceptions, storage)

### 2.1 Responsabilidad

Proveer infraestructura transversal para todos los modulos:
- autenticacion stateless con JWT,
- enforcement de permisos,
- aislamiento de datos por tenant,
- formato uniforme de errores,
- subida de objetos (PoD) en MinIO/S3 compatible.

### 2.2 Piezas clave

- Seguridad:
  - `SecurityConfig`
  - `JwtAuthenticationFilter`
  - `JwtService`
- Tenant:
  - `TenantContext` (ThreadLocal)
  - `TenantInterceptor` (limpieza por request)
  - `TenantFilterConfiguration` + `TenantFilterEnabler` (Hibernate filter)
- Excepciones:
  - `GlobalExceptionHandler`
  - `BusinessException`, `ResourceNotFoundException`, `DuplicateResourceException`
- Storage:
  - `ObjectStoragePort`
  - `MinioObjectStorageAdapter`
  - `StorageProperties`

### 2.3 RBAC y acceso

`SecurityConfig` habilita/publica:
- Publico: `/api/auth/**`, `/api/tracking/**`, `/api/public/tracking/**`, Swagger, Actuator.
- Superadmin: `/api/admin/**`.
- Chofer: se refuerza matcher explicito para `POST /api/logistics/routes/*/sync`.
- Todo lo demas requiere autenticacion.

En controladores se afina con `@PreAuthorize` por endpoint.

### 2.4 Comportamiento operativo

- `JwtAuthenticationFilter` valida token, carga `SecurityContext` y setea `TenantContext` con `tenant_id`.
- `TenantInterceptor` limpia el contexto para evitar fuga de tenant entre requests en pool de hilos.
- `TenantFilterEnabler` activa filtro Hibernate antes de repositorios (`com.saas.modules..repositories`), forzando `tenantId`.
- `GlobalExceptionHandler` devuelve error estandar y deja que 401/403 los maneje Spring Security.

---

## 3) modules.identity

### 3.1 Responsabilidad

Gestionar identidad, autenticacion, sesion extendida (refresh), usuarios por tenant y operaciones globales de superadmin sobre tenants.

### 3.2 Entidades clave

- `Tenant` (estado de vida del cliente SaaS)
- `User` (incluye `role`, `tenantId` nullable para superadmin)
- `RefreshToken` (almacena hash SHA-256 del token, nunca el token plano)
- `Plan`

Roles observados:
- `SUPER_ADMIN`
- `ADMIN_PYME`
- `DESPACHADOR`
- `CHOFER`

### 3.3 Endpoints principales

- Auth publico:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
- Usuarios tenant:
  - `GET/POST /api/users`
  - `GET/PUT/DELETE /api/users/{id}`
- Superadmin tenants:
  - `GET /api/admin/tenants`
  - `GET /api/admin/tenants/metrics`
  - `POST /api/admin/tenants/{tenantId}/suspend`
  - `POST /api/admin/tenants/{tenantId}/reactivate`

### 3.4 Reglas de negocio importantes

- Registro crea tenant en `TRIAL` y usuario `ADMIN_PYME`.
- Login valida usuario activo y estado tenant (suspendido/cancelado no entra).
- Refresh token con rotacion:
  - si token revocado se reusa, se revocan todas las sesiones del usuario.
- Suspender/reactivar tenant exige razon y auditoria (actor + timestamps).

### 3.5 Flujo tipico identity

1. Cliente registra tenant (`/register`).
2. Recibe `accessToken + refreshToken + user`.
3. Usa `accessToken` para APIs privadas.
4. Al expirar, llama `/refresh` y rota token.
5. Superadmin puede suspender/reactivar tenant por APIs admin.

---

## 4) modules.billing

### 4.1 Responsabilidad

Separar captura de pago tenant y decision administrativa:
- Tenant envia comprobante -> estado pendiente.
- Superadmin revisa y decide aprobar/rechazar.

### 4.2 Entidad y enums clave

- `Payment`
- `PaymentStatus` (incluye `PENDING_VALIDATION`, `APPROVED`, `REJECTED`)
- `PaymentMethod`

### 4.3 Endpoints

- Tenant (`ADMIN_PYME`):
  - `POST /api/billing/payments`
  - `GET /api/billing/payments?status=`
- Superadmin:
  - `GET /api/admin/billing/payments?status=`
  - `POST /api/admin/billing/payments/{paymentId}/decision`

### 4.4 Workflow principal

1. Tenant sube pago (monto, referencia, evidencia URL, fecha).
2. Se guarda en `PENDING_VALIDATION`.
3. Superadmin revisa cola y aplica decision con comentario obligatorio.
4. Si aprueba: tenant pasa a `ACTIVE` y se mueve `fechaCorte` +1 mes.
5. Si rechaza: tenant pasa a `SUSPENDED`.

### 4.5 Eventos

Se publican eventos de dominio (`PaymentSubmittedEvent`, `PaymentDecisionEvent`) para notificaciones/integraciones desacopladas.

---

## 5) modules.logistics

### 5.1 Responsabilidad

Core operativo diario:
- pedidos y estados,
- vehiculos,
- rutas,
- historial,
- PoD,
- tracking de despacho,
- sincronizacion offline de chofer (eventos + conflictos).

### 5.2 Entidades clave

- `Order`, `OrderStatus`, `OrderStatusHistory`
- `Vehicle`, `VehicleState`
- `Route`, `RouteStatus`, `RouteStop`
- `SyncEvent`, `SyncEventType`, `SyncConflict`
- `AddressReviewStatus`

### 5.3 Endpoints de pedidos

- `POST /api/logistics/orders`
- `PATCH /api/logistics/orders/{id}/status`
- `POST /api/logistics/orders/{id}/normalize-address`
- `GET /api/logistics/orders/{id}/history`
- `GET /api/logistics/orders/dispatcher-tracking`
- `POST /api/logistics/orders/{id}/pod` (multipart)
- `GET /api/logistics/orders/{id}/pod`

Roles: `ADMIN_PYME` y `DESPACHADOR`.

### 5.4 Endpoints de vehiculos

- `POST/GET /api/logistics/vehicles`
- `GET/PUT/DELETE /api/logistics/vehicles/{id}`

Roles: `ADMIN_PYME` y `DESPACHADOR`.

### 5.5 Endpoints de rutas

- Operacion admin/dispatch:
  - `POST /api/logistics/routes`
  - `POST /api/logistics/routes/{id}/start`
  - `POST /api/logistics/routes/{id}/complete`
- Operacion chofer:
  - `GET /api/logistics/routes/assigned`
  - `POST /api/logistics/routes/{id}/driver-start`
  - `POST /api/logistics/routes/{id}/driver-complete`
  - `GET /api/logistics/routes/{id}/offline-packet`
  - `POST /api/logistics/routes/{id}/sync`

### 5.6 Reglas de estado relevantes

- Solo ordenes `CREATED` entran a una ruta.
- Iniciar ruta: ruta debe estar `ASSIGNED` y ordenes `ASSIGNED`.
- Completar ruta: ruta en `IN_PROGRESS` y ordenes `IN_TRANSIT`.
- Cada transicion agrega historial inmutable por orden.

### 5.7 Offline sync e idempotencia

`/sync` usa `deviceId + clientEventId` para deduplicar.

Resultados por lote:
- `accepted`: eventos aplicados.
- `duplicates`: repetidos ignorados.
- `conflicts`: invalido o transicion no permitida.

El backend persiste:
- evento original (`SyncEvent`),
- conflicto (`SyncConflict`) con resolucion server-side.

Tambien incrementa metricas (`logistics.route.sync.events`) por outcome.

### 5.8 PoD (proof of delivery)

- Solo permitido cuando orden esta `DELIVERED`.
- Tipos permitidos: jpeg/png/webp.
- Limite de tamano: 5 MB.
- Se guarda metadata en DB y objeto en storage S3-compatible (MinIO).

---

## 6) modules.tracking

### 6.1 Responsabilidad

Exponer tracking publico canonico, desacoplado de UI interna.

### 6.2 Endpoint

- `GET /api/public/tracking/{trackingCode}`

Retorna:
- estado actual de la orden,
- historial publico,
- enrichment (driver first name + ETA si existe).

### 6.3 Relacion con legacy

Existe tambien un controlador legacy en logistics:
- `GET /api/tracking/{trackingCode}`

Ambos delegan a `TrackingService`, por lo que funcionalmente convergen, cambiando solo contrato/ruta expuesta.

---

## 7) modules.ai

### 7.1 Responsabilidad

Automatizar dos procesos:
1) normalizacion de direcciones por orden,
2) optimizacion de orden de paradas para crear rutas.

### 7.2 Politica Gemini-only

La app configura Spring AI con Google GenAI y excluye OpenAI autoconfig.

Implicacion:
- proveedor de IA esperado: Gemini.
- adaptador: `GeminiAddressNormalizationAdapter`.
- si cambia proveedor, debe ser cambio explicito de arquitectura, no "fallback silencioso" de proveedor.

### 7.3 Endpoints AI

- Direcciones:
  - `POST /api/ai/address-normalizations/{orderId}`
  - `POST /api/ai/address-normalizations/{orderId}/manual-correction`
  - `GET /api/ai/address-normalizations/{orderId}/attempts/latest`
- Rutas:
  - `POST /api/ai/address-normalizations/routes/optimization/preview`
  - `POST /api/ai/address-normalizations/routes/optimization/confirm`

Roles: `ADMIN_PYME` y `DESPACHADOR`.

### 7.4 Reglas de normalizacion

- Guarda direccion normalizada + componentes + coords + confianza.
- Usa umbral de autoaceptacion (`>= 0.80`).
- Si requiere revision, permite correccion manual y deja log auditable.
- Guarda log de intentos en `AiNormalizationLog`.

### 7.5 Reglas de optimizacion

- Solo ordenes en `CREATED`.
- Maximo 50 paradas para optimizacion AI.
- `preview` devuelve orden optimizado, distancia estimada y firma hash.
- `confirm` exige firma valida (si no, conflicto "stale/invalid preview").

---

## 8) Aislamiento tenant y RBAC (cross-cutting)

### 8.1 Aislamiento tenant

Cadena de control:
1. JWT trae claim `tenant_id`.
2. Filter setea `TenantContext`.
3. AOP habilita filtro Hibernate por `tenantId` en repos.
4. Servicios refuerzan con metodos `requiredTenantId()` y queries `...AndTenantId`.

Resultado:
- usuario tenant solo toca sus datos.
- superadmin opera endpoints globales `/api/admin/**`.

### 8.2 RBAC

Se aplica en dos capas:
- URL-level en `SecurityConfig`.
- Metodo-level con `@PreAuthorize`.

Esto evita exposicion accidental por rutas nuevas y reduce errores de autorizacion parcial.

---

## 9) JWT + refresh (cross-cutting)

- Access token corto (configurable; en properties 15 min).
- Refresh token largo (configurable; en properties 7 dias).
- Refresh guardado como hash SHA-256.
- Rotacion en cada refresh.
- Reuso de refresh revocado => revoca todas las sesiones del usuario.

Buenas practicas cliente:
- refrescar on-demand ante 401,
- no intentar refresh en loop infinito,
- cerrar sesion ante refresh invalido.

---

## 10) Flyway y estrategia de migraciones

Observado en `db/migration`: versionado incremental `V1 ... V16`.

Incluye hitos:
- identidad base,
- refresh tokens,
- seed superadmin,
- billing,
- tablas logisticas,
- PoD,
- historial con actor,
- route driver/ETA,
- fundacion IA + offline sync,
- ajustes de compatibilidad de schema.

Reglas para extender:
1. Nunca editar migraciones ya aplicadas.
2. Crear nueva `V#__descripcion.sql` por cambio.
3. Si hay backfill, separar DDL y data-fix cuando sea posible.
4. Probar upgrade en snapshot realista antes de prod.

---

## 11) Ejemplos secuenciales (end-to-end)

### 11.1 Registro -> login -> operacion tenant

1. `POST /api/auth/register` crea tenant TRIAL + admin.
2. `POST /api/auth/login` emite tokens.
3. Admin crea vehiculo (`/api/logistics/vehicles`).
4. Admin crea orden (`/api/logistics/orders`).
5. Admin normaliza direccion (`/api/ai/address-normalizations/{orderId}`).

### 11.2 Crear orden -> optimizar -> confirmar ruta

1. Crear multiples ordenes `CREATED`.
2. `POST .../routes/optimization/preview` con `vehicleId`, `driverId`, `orderIds`.
3. Mostrar sugerencia y firma.
4. `POST .../routes/optimization/confirm` con firma intacta.
5. Backend crea ruta en logistics con metadata de optimizacion.

### 11.3 Driver offline sync

1. Chofer obtiene asignadas (`/routes/assigned`).
2. Descarga `offline-packet`.
3. App movil registra eventos offline con `clientEventId` unico.
4. Reconecta y envia `/sync`.
5. Backend responde conteo `accepted/duplicates/conflicts` y persiste auditoria.

### 11.4 Public tracking

1. Cliente externo abre tracking code.
2. Front consume canonico `/api/public/tracking/{trackingCode}`.
3. Recibe estado + historial + driver first name + ETA.
4. Si migracion legacy aun activa, frontend puede fallback a `/api/tracking/{trackingCode}`.

---

## 12) Operacion: que monitorear

### 12.1 Indicadores recomendados

- Seguridad:
  - tasa 401/403 por endpoint y por rol.
  - fallos de refresh token.
- Tenant:
  - requests sin `tenant_id` en endpoints tenant.
  - cantidad de tenants suspendidos/reactivados.
- Billing:
  - tamano de cola `PENDING_VALIDATION`.
  - lead time de decision de pago.
- Logistica:
  - transiciones invalidas de orden/ruta.
  - metricas de sync offline por outcome.
- IA:
  - ratio `AUTO_ACCEPTED` vs `REVIEW_REQUIRED`.
  - porcentaje fallback.
  - latencia de normalizacion.

### 12.2 Fallas comunes y respuesta

- `Tenant context is required`:
  - token sin `tenant_id` o uso de endpoint tenant con usuario no tenant.
- `Insufficient permissions (403)`:
  - rol incorrecto o guard frontend defectuoso.
- Conflicto al confirmar optimizacion:
  - preview stale o firma alterada.
- Sync con muchos conflicts:
  - app chofer enviando eventos fuera de orden o con estado invalido.
- PoD rechazado:
  - estado de orden incorrecto, tipo no permitido o archivo > 5MB.

---

## 13) Como extender de forma segura

1. Definir cambio por modulo (evitar mezclar identidad, billing y logistica en un solo PR grande).
2. Mantener contrato API backward compatible cuando sea posible.
3. Agregar `@PreAuthorize` y pruebas de RBAC para endpoints nuevos.
4. En modulos tenant, usar siempre `tenantId` de contexto, no del payload cliente.
5. Agregar migracion Flyway nueva para cada cambio de schema.
6. Si agregas eventos, hacer handlers idempotentes y tolerantes a reintentos.
7. Documentar payload real con Swagger y actualizar guias frontend.
8. Para IA, respetar politica Gemini-only salvo decision arquitectonica explicita.

---

## 14) Checklist rapido antes de liberar cambios

- Endpoints nuevos con RBAC correcto.
- Aislamiento tenant validado en consultas.
- Migracion Flyway nueva y probada.
- Errores devuelven contrato estandar (`ErrorResponse`).
- Flujos criticos probados: auth, billing decision, ruta chofer, tracking publico.
- Si toca AI/offline sync, validar escenarios de conflicto y reintento.
