# PRD: SaaS de Micro-logística e IA para PYMES (Edición Venezuela)

## 1. Visión del Producto

Un sistema SaaS multi-inquilino (Multi-tenant) diseñado para que las PYMES venezolanas gestionen sus operaciones de despacho, flotas de última milla y rutas, integrando Inteligencia Artificial para la optimización de recursos y la normalización de datos. El modelo de negocio se basa en suscripciones validadas mediante métodos de pago locales (Pago Móvil y Transferencia Bancaria).

### 1.1. Problema a Resolver

Las PYMES venezolanas que realizan entregas de última milla operan con herramientas manuales (hojas de cálculo, WhatsApp, llamadas telefónicas), lo que genera:

- **Ineficiencia operativa:** Rutas no optimizadas que desperdician gasolina y tiempo.
- **Falta de trazabilidad:** No hay visibilidad en tiempo real del estado de las entregas.
- **Direcciones ambiguas:** El sistema de direcciones en Venezuela es descriptivo y no estandarizado, dificultando la geolocalización.
- **Pérdida de paquetes:** Sin sistema de prueba de entrega (PoD), las disputas son comunes.

### 1.2. Solución Propuesta

Una plataforma SaaS que centralice la operación logística con:

- Gestión integral de órdenes, rutas y flota.
- IA para normalizar direcciones venezolanas y optimizar rutas.
- Prueba de entrega digital (foto/firma).
- Modelo de pago adaptado al ecosistema financiero venezolano.

---

## 2. Supuestos y Restricciones

### Supuestos

- Las PYMES objetivo tienen al menos 1 vehículo y 1 chofer dedicado a entregas.
- Los choferes cuentan con un smartphone con cámara (Android 8+).
- Las PYMES están familiarizadas con Pago Móvil y Transferencia Bancaria.
- Existe conectividad a internet intermitente pero disponible en zonas urbanas.

### Restricciones

- **Sin API bancaria directa:** Los pagos deben validarse manualmente por el SuperAdmin (no existe una API pública unificada de los bancos venezolanos).
- **Conectividad inestable:** La experiencia del chofer DEBE funcionar offline y sincronizar al reconectarse.
- **Presupuesto MVP limitado:** La infraestructura debe ser económica; se priorizan servicios cloud con tier gratuito o bajo coste.
- **Moneda:** Los precios de suscripción se definen en USD con equivalente en Bs al tipo de cambio BCV del día.

---

## 3. Propuesta de Roles del Sistema

Para mantener el control y la seguridad en una operación logística, el sistema debe manejar una jerarquía clara:

| # | Rol | Descripción | Permisos Clave |
|---|-----|-------------|----------------|
| 1 | **SuperAdmin** (Equipo SaaS) | Gestiona los *tenants* (las PYMES), aprueba/rechaza pagos, monitorea la salud del sistema | CRUD tenants, validar pagos, dashboard global, gestión de planes |
| 2 | **Admin PYME** (Dueño/Gerente) | Acceso total a su entorno. Gestiona empleados, vehículos, reportes y configuración | CRUD usuarios de su tenant, CRUD vehículos, reportes, configuración |
| 3 | **Despachador** (Operador Logístico) | Crea órdenes, asigna paquetes a choferes, monitorea rutas y atiende incidencias | CRUD órdenes, asignar rutas, monitoreo en tiempo real |
| 4 | **Chofer/Repartidor** | Usa la vista móvil para ver su ruta, confirmar entregas (PoD) y reportar novedades | Ver ruta asignada, actualizar estado de entrega, subir PoD |
| 5 | **Cliente Final** (Solo lectura) | Accede vía enlace público único para ver el estado de su paquete en tiempo real | Tracking público (sin autenticación) |

---

## 4. Requerimientos Funcionales (RF)

### RF-01: Registro y Onboarding de Tenants

- El sistema DEBE permitir que una PYME se registre proporcionando: nombre de la empresa, RIF, email del administrador, y teléfono de contacto.
- Al registrarse, el tenant inicia en estado `TRIAL` con acceso limitado por 7 días.
- El Admin PYME DEBE poder completar su perfil con: dirección, zona de operación y logo.

### RF-02: Gestión de Suscripciones y Pagos (Local)

- El sistema DEBE permitir a la PYME registrar un pago con: referencia, banco origen, banco destino, fecha, monto y captura de pantalla del comprobante.
- El SuperAdmin DEBE poder ver una cola de pagos pendientes, aprobar o rechazar cada pago con un comentario, y cambiar el estado del tenant a `ACTIVE`.
- Al aprobarse un pago, el sistema DEBE calcular y asignar la fecha de corte del período de suscripción.
- El sistema DEBE notificar al Admin PYME cuando su suscripción esté próxima a vencer (7 días, 3 días, 1 día).

### RF-03: Gestión de Usuarios e Identidad

- El Admin PYME DEBE poder crear, editar, desactivar y eliminar usuarios de su tenant.
- Cada usuario DEBE tener un rol asignado (Despachador o Chofer).
- El sistema DEBE soportar autenticación con email + contraseña.
- El sistema DEBE implementar refresh tokens con rotación para mantener sesiones de larga duración en la app móvil del chofer.

### RF-04: Gestión de Flota (Vehículos)

- El Admin PYME DEBE poder registrar vehículos con: placa, marca, modelo, año, capacidad en kg y capacidad en volumen (m³).
- Cada vehículo PUEDE tener un chofer asignado por defecto.
- El sistema DEBE mostrar el estado del vehículo: `DISPONIBLE`, `EN_RUTA`, `MANTENIMIENTO`.

### RF-05: Gestión de Órdenes (Tracking)

- El Despachador DEBE poder crear órdenes con: nombre del cliente, teléfono, dirección (texto libre), notas de entrega, y dimensiones/peso del paquete.
- Al crearse, la orden inicia en estado `PENDIENTE`.
- Los estados válidos de una orden son: `PENDIENTE` → `ASIGNADA` → `EN_RUTA` → `ENTREGADO` | `FALLIDO` → `REPROGRAMADA`.
- Cada cambio de estado DEBE registrar: usuario que lo realizó, timestamp, y ubicación GPS (si aplica).
- El sistema DEBE generar un código de tracking único (formato: `TRK-{TENANT_PREFIX}-{YYYYMMDD}-{SEQ}`).

### RF-06: Asignación de Rutas

- El Despachador DEBE poder crear hojas de ruta diarias seleccionando: chofer, vehículo y conjunto de órdenes.
- El sistema DEBE permitir ordenar manualmente las paradas o solicitar optimización automática por IA.
- El Despachador DEBE poder visualizar la ruta en un mapa antes de confirmarla.

### RF-07: Prueba de Entrega (PoD)

- El Chofer DEBE poder marcar una entrega como completada adjuntando: fotografía del paquete entregado y nombre de quien recibe.
- Opcionalmente, el cliente puede firmar digitalmente en la pantalla del dispositivo.
- La evidencia de entrega DEBE almacenarse asociada a la orden con timestamp y coordenadas GPS.

### RF-08: Modo Offline del Chofer

- La vista del chofer DEBE funcionar sin conexión a internet para: ver la lista de paradas, marcar entregas como completadas y capturar fotos de PoD.
- Al recuperar conectividad, el sistema DEBE sincronizar automáticamente todos los cambios pendientes en orden cronológico.
- El sistema DEBE resolver conflictos de sincronización priorizando los datos del chofer (last-write-wins con el timestamp del dispositivo).

### RF-09: Tracking Público (Cliente Final)

- El sistema DEBE generar un enlace público único por cada orden (sin autenticación requerida).
- La página de tracking DEBE mostrar: estado actual, historial de estados con timestamps, nombre del chofer asignado (solo primer nombre) y ETA estimado.

### RF-10: Panel del SuperAdmin

- Dashboard con métricas globales: total de tenants activos, tenants en trial, pagos pendientes de validación, ingresos del mes.
- Lista de tenants con filtros por estado (`TRIAL`, `ACTIVE`, `SUSPENDED`, `CANCELLED`).
- Capacidad de suspender o reactivar un tenant manualmente.

### RF-11: Notificaciones

- El sistema DEBE enviar notificaciones por email para: confirmación de registro, cambio de estado de pago, vencimiento de suscripción y cambio de estado de orden (al cliente final).
- *Fase futura:* Integración con la API de WhatsApp Business para notificaciones al cliente final.

---

## 5. Requerimientos No Funcionales (RNF)

| ID | Categoría | Requerimiento | Métrica |
|----|-----------|---------------|---------|
| RNF-01 | Multi-Tenancy | Aislamiento total de datos entre tenants mediante discriminador `tenant_id` en todas las tablas. Los datos del Tenant A NUNCA deben ser accesibles por el Tenant B. | 0 filtraciones de datos entre tenants |
| RNF-02 | Rendimiento | El backend DEBE soportar al menos 500 peticiones concurrentes de actualización de ubicación. | Latencia p95 < 300ms — p99 < 500ms |
| RNF-03 | Disponibilidad | El sistema DEBE mantener alta disponibilidad. | Uptime ≥ 99.5% mensual |
| RNF-04 | Seguridad | Autenticación mediante JWT con refresh token rotation. Contraseñas hasheadas con BCrypt (factor ≥ 12). | Cumplimiento OWASP Top 10 |
| RNF-05 | Resiliencia | El frontend del chofer DEBE funcionar offline por al menos 8 horas y sincronizar al reconectar. | Pérdida de datos = 0 tras sincronización |
| RNF-06 | Almacenamiento | Las fotos de PoD DEBEN comprimirse antes de subirse (max 500KB). | Almacenamiento < 2GB por tenant/mes (estimado 200 entregas/día) |
| RNF-07 | Tiempo de Respuesta | Las páginas principales DEBEN cargar en menos de 3 segundos en una conexión 3G rápida. | LCP < 2.5s, FID < 100ms |

---

## 6. Casos de Uso de Inteligencia Artificial

### CU-IA-01: Normalización de Direcciones (LLM)

- **Problema:** En Venezuela las direcciones son descriptivas ("De la panadería La Vega, 2 cuadras arriba, casa azul con portón negro").
- **Solución:** Un modelo de IA toma el texto crudo y lo estructura en: estado, municipio, parroquia, zona/urbanización, referencia, y estima coordenadas aproximadas.
- **Fallback:** Si la IA no tiene confianza suficiente (score < 0.7), marcar como `REQUIERE_REVISIÓN` para revisión manual del Despachador.
- **Entrenamiento:** Almacenar las correcciones manuales para mejorar el modelo progresivamente.

### CU-IA-02: Optimización de Rutas (Heurística/IA)

- **Entrada:** Un lote de N entregas (≤ 50) con coordenadas estimadas.
- **Salida:** Orden óptimo de visita que minimice distancia total y tiempo estimado.
- **Consideraciones:** Tráfico histórico por franja horaria, ventanas de entrega (si existen), capacidad del vehículo.
- **Algoritmo MVP:** Nearest Neighbor Heuristic → evolucionar a OR-Tools o modelo de ML.

### CU-IA-03: Predicción de Demanda (Fase Futura)

- Modelos simples de ML (regresión, series de tiempo) para predecir qué días la PYME necesitará más choferes basándose en su histórico de entregas.
- **Mínimo de datos requerido:** 3 meses de historial operativo.

---

## 7. Arquitectura del Sistema

Optaremos por un **Monolito Modular** en el backend. Es la mejor decisión de ingeniería para empezar: evita la complejidad operativa de los microservicios, pero mantiene el código estrictamente separado por dominios, permitiendo extraer módulos a microservicios en el futuro si la carga lo amerita.

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Frontend** | React 18+ (SPA) + Vite | Ecosistema maduro, gran comunidad, PWA-ready |
| **UI Framework** | Shadcn/UI + Tailwind CSS | Componentes accesibles, personalización total, bajo bundle size |
| **State Management** | TanStack Query + Zustand | Server state (Query) + client state (Zustand), mínimo boilerplate |
| **Backend** | Java 21 + Spring Boot 3.x | Tipado fuerte, rendimiento, ecosistema empresarial sólido |
| **Base de Datos** | PostgreSQL 16 | JSONB para metadata flexible, PostGIS para geolocalización, Row Level Security compatible |
| **Migraciones** | Flyway | Versionado de esquema, rollback controlado, integración nativa con Spring |
| **Cache** | Redis (opcional MVP) | Sesiones, rate limiting, cache de rutas optimizadas |
| **Almacenamiento** | MinIO o S3-compatible | Fotos de PoD, comprobantes de pago, logos de tenants |
| **IA** | Spring AI + Google Gemini API | Normalización de direcciones vía LLM |

---

## 8. Modelo de Datos (Core Entities)

Las tablas principales en PostgreSQL:

```text
tenants
  - id (UUID, PK)
  - nombre (VARCHAR)
  - rif (VARCHAR, UNIQUE)
  - status (ENUM: TRIAL, ACTIVE, SUSPENDED, CANCELLED)
  - plan_id (FK → plans)
  - fecha_registro (TIMESTAMP)
  - fecha_corte (TIMESTAMP)
  - logo_url (VARCHAR, NULLABLE)
  - zona_operacion (VARCHAR)

plans
  - id (UUID, PK)
  - nombre (VARCHAR)
  - precio_usd (DECIMAL)
  - max_choferes (INT)
  - max_ordenes_mes (INT)
  - max_vehiculos (INT)
  - tiene_ia (BOOLEAN)
  - activo (BOOLEAN)

payments
  - id (UUID, PK)
  - tenant_id (FK → tenants)
  - plan_id (FK → plans)
  - tipo_pago (ENUM: PAGO_MOVIL, TRANSFERENCIA)
  - referencia (VARCHAR)
  - banco_origen (VARCHAR)
  - banco_destino (VARCHAR)
  - monto_bs (DECIMAL)
  - monto_usd (DECIMAL)
  - tasa_bcv (DECIMAL)
  - comprobante_url (VARCHAR)
  - status (ENUM: PENDING, APPROVED, REJECTED)
  - comentario_admin (TEXT, NULLABLE)
  - fecha_pago (TIMESTAMP)
  - fecha_validacion (TIMESTAMP, NULLABLE)

users
  - id (UUID, PK)
  - tenant_id (FK → tenants, NULLABLE para SuperAdmin)
  - email (VARCHAR, UNIQUE)
  - password_hash (VARCHAR)
  - nombre (VARCHAR)
  - apellido (VARCHAR)
  - telefono (VARCHAR)
  - role (ENUM: SUPER_ADMIN, ADMIN_PYME, DESPACHADOR, CHOFER)
  - activo (BOOLEAN)
  - created_at (TIMESTAMP)

vehicles
  - id (UUID, PK)
  - tenant_id (FK → tenants)
  - placa (VARCHAR)
  - marca (VARCHAR)
  - modelo (VARCHAR)
  - anio (INT)
  - capacidad_kg (DECIMAL)
  - capacidad_m3 (DECIMAL, NULLABLE)
  - status (ENUM: DISPONIBLE, EN_RUTA, MANTENIMIENTO)
  - chofer_default_id (FK → users, NULLABLE)

orders
  - id (UUID, PK)
  - tenant_id (FK → tenants)
  - tracking_code (VARCHAR, UNIQUE)
  - cliente_nombre (VARCHAR)
  - cliente_telefono (VARCHAR)
  - direccion_cruda (TEXT)
  - direccion_normalizada (JSONB, NULLABLE)
  - ia_confidence_score (DECIMAL, NULLABLE)
  - lat (DECIMAL, NULLABLE)
  - lng (DECIMAL, NULLABLE)
  - peso_kg (DECIMAL, NULLABLE)
  - notas (TEXT, NULLABLE)
  - status (ENUM: PENDIENTE, ASIGNADA, EN_RUTA, ENTREGADO, FALLIDO, REPROGRAMADA)
  - created_by (FK → users)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

routes
  - id (UUID, PK)
  - tenant_id (FK → tenants)
  - chofer_id (FK → users)
  - vehicle_id (FK → vehicles)
  - fecha (DATE)
  - status (ENUM: PLANIFICADA, EN_CURSO, COMPLETADA, CANCELADA)
  - optimizada_por_ia (BOOLEAN)
  - distancia_estimada_km (DECIMAL, NULLABLE)
  - created_at (TIMESTAMP)

route_stops
  - id (UUID, PK)
  - route_id (FK → routes)
  - order_id (FK → orders)
  - orden_visita (INT)
  - status (ENUM: PENDIENTE, VISITADA, ENTREGADO, FALLIDO, SALTADA)
  - hora_llegada (TIMESTAMP, NULLABLE)
  - pod_foto_url (VARCHAR, NULLABLE)
  - pod_firma_url (VARCHAR, NULLABLE)
  - pod_receptor_nombre (VARCHAR, NULLABLE)
  - pod_lat (DECIMAL, NULLABLE)
  - pod_lng (DECIMAL, NULLABLE)
  - notas_chofer (TEXT, NULLABLE)

order_status_history
  - id (UUID, PK)
  - order_id (FK → orders)
  - status_anterior (VARCHAR)
  - status_nuevo (VARCHAR)
  - cambiado_por (FK → users)
  - lat (DECIMAL, NULLABLE)
  - lng (DECIMAL, NULLABLE)
  - created_at (TIMESTAMP)

ai_normalization_logs
  - id (UUID, PK)
  - order_id (FK → orders)
  - input_text (TEXT)
  - output_json (JSONB)
  - confidence_score (DECIMAL)
  - modelo_usado (VARCHAR)
  - fue_corregido (BOOLEAN)
  - correccion_json (JSONB, NULLABLE)
  - created_at (TIMESTAMP)
```

---

## 9. Stack Tecnológico (Backend y Dependencias Spring)

Para el `pom.xml` o `build.gradle`:

**Core:**
* `spring-boot-starter-web` — APIs REST.
* `spring-boot-starter-data-jpa` — ORM con Hibernate.
* `spring-boot-starter-security` — Capa de seguridad y roles.
* `spring-boot-starter-validation` — Validación de DTOs con Jakarta Validation.
* `spring-boot-starter-mail` — Envío de emails transaccionales.

**Auth:**
* `jjwt-api`, `jjwt-impl`, `jjwt-jackson` — Generación y validación de JWT.

**Base de Datos:**
* `postgresql` — Driver de PostgreSQL.
* `flyway-core` — Migraciones de esquema versionadas.

**IA:**
* `spring-ai-starter-model-google-genai` — Normalización de direcciones con Gemini (proveedor único activo).

**Utilidades:**
* `mapstruct` — Mapeo automático entre entidades y DTOs.
* `lombok` — Reducción de boilerplate.

**Testing:**
* `spring-boot-starter-test` — JUnit 5 + Mockito.
* `testcontainers` — Tests de integración con PostgreSQL real.

---

## 10. Estructura de Carpetas (Clean Architecture Lite)

Aplicaremos un diseño guiado por dominios (DDD) dentro del monolito para garantizar un software escalable y de alta calidad:

```text
src/main/java/com/tuempresa/micrologistics/
│
├── core/                       # Configuraciones transversales
│   ├── config/                 # Configuración de beans globales
│   ├── security/               # Filtros JWT, SecurityFilterChain
│   ├── tenant/                 # TenantInterceptor, TenantContext (ThreadLocal)
│   ├── exceptions/             # @ControllerAdvice, excepciones de negocio
│   └── storage/                # Servicio de almacenamiento de archivos (S3/MinIO)
│
├── modules/                    # Módulos aislados del negocio
│   │
│   ├── billing/                # Dominio: Suscripciones, Planes y Pagos
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   └── dtos/
│   │
│   ├── logistics/              # Dominio core: Órdenes, Rutas, Vehículos
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   └── dtos/
│   │
│   ├── identity/               # Dominio: Usuarios, Roles, Auth
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   └── dtos/
│   │
│   ├── tracking/               # Dominio: Tracking público, enlaces, ETA
│   │   ├── controllers/
│   │   └── services/
│   │
│   ├── ai/                     # Dominio: Normalización de direcciones, Rutas IA
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   └── prompts/            # Templates de prompts para LLM
│   │
│   └── notifications/          # Dominio: Email, (futuro: WhatsApp)
│       ├── services/
│       └── templates/          # Templates de email (Thymeleaf)
│
└── shared/                     # DTOs compartidos, utilidades, constantes
    ├── dtos/
    └── utils/
```

---

## 11. Modelo de Suscripción

| Característica | Plan Starter | Plan Growth | Plan Pro |
|---------------|-------------|-------------|----------|
| **Precio (USD/mes)** | $15 | $35 | $75 |
| **Choferes** | Hasta 3 | Hasta 10 | Ilimitados |
| **Órdenes/mes** | 300 | 1,000 | Ilimitadas |
| **Vehículos** | 2 | 5 | Ilimitados |
| **IA (normalización)** | ❌ | ✅ (100 norm./mes) | ✅ (ilimitadas) |
| **IA (optimización rutas)** | ❌ | ❌ | ✅ |
| **Soporte** | Email | Email + WhatsApp | Prioritario |
| **Período de gracia** | 3 días | 5 días | 7 días |

> **Trial:** 7 días con funcionalidades del Plan Starter. No requiere pago inicial.

---

## 12. Integraciones Externas

| Servicio | Propósito | Fase |
|----------|-----------|------|
| **Google Gemini API** | Normalización de direcciones | MVP (Fase 5) |
| **Google Maps / Leaflet + OSM** | Visualización de rutas en mapa | MVP (Fase 4) |
| **SMTP** (Resend / Brevo) | Emails transaccionales | MVP (Fase 2) |
| **MinIO / S3** | Almacenamiento de fotos PoD y comprobantes | MVP (Fase 3) |
| **WhatsApp Business API** | Notificaciones al cliente final | Post-MVP |
| **Google OR-Tools** | Optimización avanzada de rutas | Post-MVP |
| **API BCV** (scraping) | Tasa de cambio oficial para conversión Bs/USD | Post-MVP |

---

## 13. Riesgos y Mitigaciones

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|-------------|---------|------------|
| 1 | Conectividad inestable en zonas de entrega | Alta | Alto | PWA con Service Workers, modo offline con IndexedDB, sincronización automática |
| 2 | Direcciones venezolanas no geocodificables | Alta | Alto | LLM normalización + fallback manual + aprendizaje de correcciones |
| 3 | No existe API bancaria para validar pagos | Certeza | Medio | Validación manual por SuperAdmin con comprobante fotográfico |
| 4 | Inflación y fluctuación del tipo de cambio | Alta | Medio | Precios en USD, conversión automática a Bs con tasa BCV del día |
| 5 | Choferes con smartphones de gama baja | Media | Medio | Frontend ligero, compresión de imágenes client-side, mínimo JS bundle |
| 6 | Costos de API de IA escalando | Media | Medio | Rate limiting por plan, cache de normalizaciones similares, modelo local como fallback |
| 7 | Competencia de soluciones internacionales | Baja | Alto | Diferenciación con pagos locales, IA adaptada a direcciones VE, precios en USD accesibles |

---

## 14. Métricas de Éxito (KPIs)

### KPIs de Producto

| Métrica | Objetivo MVP (3 meses) |
|---------|----------------------|
| PYMES registradas | ≥ 20 |
| PYMES con suscripción activa | ≥ 8 (40% conversión trial) |
| Órdenes procesadas/mes (total) | ≥ 2,000 |
| Tasa de entregas exitosas | ≥ 85% |
| NPS (Net Promoter Score) | ≥ 30 |

### KPIs Técnicos

| Métrica | Objetivo |
|---------|----------|
| Latencia API (p95) | < 300ms |
| Uptime mensual | ≥ 99.5% |
| Tiempo de onboarding (registro → primera orden) | < 10 minutos |
| Precisión de normalización IA | ≥ 70% sin corrección manual |
| Sincronización offline → online | < 30 segundos tras reconectar |

---

## 15. Estrategia de Despliegue

### Ambientes

| Ambiente | Propósito | Infraestructura |
|----------|-----------|-----------------|
| **Local** | Desarrollo | Docker Compose (PostgreSQL + MinIO + Redis + App) |
| **Staging** | QA y demos | Railway / Render (free tier) |
| **Producción** | Usuarios reales | Railway / DigitalOcean App Platform |

### Containerización

- **Docker:** Dockerfile multi-stage para backend (build con Maven → runtime con JRE 21 slim).
- **Docker Compose:** Orquestación local de todos los servicios.
- **Variables de entorno:** Configuración externalizada vía `.env` / secrets del proveedor cloud.

### CI/CD

- **GitHub Actions:**
  - `ci.yml` — Build + tests + lint en cada PR.
  - `deploy-staging.yml` — Deploy automático a staging en merge a `develop`.
  - `deploy-prod.yml` — Deploy manual (approval) a producción en merge a `main`.

---

## 16. Plan de Acción (Roadmap MVP)

### Fase 1: Core de Identidad y Tenencia (Semanas 1-2)

- Configurar Spring Boot 3.x + PostgreSQL + Flyway.
- Implementar módulo `identity`: registro, login, JWT con refresh tokens.
- Implementar mecanismo Multi-Tenant (`TenantInterceptor` + `TenantContext`).
- Configurar Docker Compose para desarrollo local.
- **Entregable:** API de auth funcionando con aislamiento multi-tenant.

### Fase 2: Módulo de Facturación Local (Semana 3)

- CRUD de planes de suscripción.
- Flujo de registro de pago (Pago Móvil / Transferencia) con subida de comprobante.
- Panel SuperAdmin para cola de pagos y validación.
- Notificaciones por email (registro, aprobación de pago).
- **Entregable:** Ciclo completo de suscripción con pagos locales.

### Fase 3: Core Logístico (Semanas 4-6)

- CRUD de vehículos.
- CRUD de órdenes con tracking code.
- Creación y asignación de rutas.
- Historial de estados de orden.
- Prueba de Entrega (PoD) con fotos.
- Almacenamiento de archivos (MinIO/S3).
- **Entregable:** Motor logístico completo con PoD.

### Fase 4: Frontend y Experiencia del Chofer (Semanas 7-8)

- Setup React + Vite + Shadcn/UI.
- Vistas de login, dashboard Admin PYME, gestión de órdenes.
- Vista responsive del chofer con lista de paradas.
- Página de tracking público (cliente final).
- Visualización de rutas en mapa (Leaflet + OSM).
- **Entregable:** Frontend funcional con todas las vistas core.

### Fase 5: Inyección de IA y Offline (Semanas 9-10)

- Integrar Spring AI para normalización de direcciones.
- Implementar PWA con Service Workers para modo offline del chofer.
- Sincronización offline → online con resolución de conflictos.
- Cache de normalizaciones para reducir costos de API.
- **Entregable:** MVP completo con IA y resiliencia offline.

---

Esta estructura está diseñada para soportar un alto volumen de transacciones y permitirte crecer el software de manera organizada. El monolito modular facilita la evolución progresiva hacia microservicios cuando la escala lo justifique.
