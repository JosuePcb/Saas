# AGENTS Guide

Repository: Spring Boot 3.5 / Java 21 monolith-modulith for SaaS logistics.

## Quick Start
- Prereqs: Java 21, Docker (for Testcontainers), Git, Gradle wrapper present.
- Install deps: `./gradlew --version` (downloads wrapper); dependencies resolve automatically.
- Environment: default profile uses application.properties; tests use application-test.properties + Testcontainers PostgreSQL.
- IDE: enable annotation processing (MapStruct + Lombok).

## Build / Run / Verify
- Full build + tests: `./gradlew clean build`.
- Compile only: `./gradlew compileJava`.
- Run app: `./gradlew bootRun` (uses default profile).
- Run migrations only: `./gradlew flywayMigrate` (Flyway dependency present; ensure DB env vars set if used).
- Build boot jar: `./gradlew bootJar` → `build/libs/saas-0.0.1-SNAPSHOT.jar`.
- Docker compose (local stack): `docker compose up -d` from repo root (uses compose.yaml with postgres).

## Testing Commands
- All tests: `./gradlew test`.
- Single test class: `./gradlew test --tests "com.saas.core.security.JwtServiceTest"` (replace with target).
- Single test method: `./gradlew test --tests "com.saas.modules.identity.controllers.UserControllerRbacTest.listUsers"`.
- Rerun failed only: `./gradlew test --tests @failed` (after a failed run).
- Test reports: HTML under `build/reports/tests/test/index.html`; XML under `build/test-results/test`.
- Tests rely on Testcontainers PostgreSQL; Docker must be running.

## Lint / Format
- No formatter task configured (no Spotless/Checkstyle). Match existing style: spaces over tabs (default IntelliJ), 4-space indent in Java.
- Use `./gradlew spotlessApply` only if later added; currently absent.
- Prefer organizing imports: java.*, javax.*, third-party (Spring, Lombok, MapStruct), project packages last; no unused imports.

## Language / Types
- Java 21 (toolchain enforced in build.gradle).
- Prefer records for DTOs where immutable; use Lombok `@Builder`/`@Getter`/`@Setter` on entities or mutable types when consistent with existing code.
- Use `UUID` for identifiers; store tenant/user ids as UUID consistently.
- Favor `Optional<T>` for repository lookups only when returning optional; otherwise validate and throw domain exceptions.
- Use `List.of()` for small immutable lists; prefer `Collections.emptyList()` over null.

## Modules & Packages
- Root package `com.saas` with subpackages: `core` (cross-cutting), `modules.identity`, etc.
- Keep module boundaries clean: controllers → services → repositories → entities/DTOs.
- Tenant awareness: resolve tenant via `TenantContext.getCurrentTenantId()` in service/data access.

## Dependency Injection
- Use constructor injection for services/components; avoid field injection.
- Annotate transactional service methods with `@Transactional`; prefer readOnly where applicable.
- Reuse existing beans (PasswordEncoder, mappers) instead of manual instantiation.

## Mapping & DTOs
- MapStruct is available; create interfaces annotated with `@Mapper(componentModel = "spring")`.
- DTO naming: requests end with `Request`, responses with `Response`; tests follow `*Test`.
- Validate input with `jakarta.validation` annotations on request records; enforce at controller layer.

## Error Handling
- Custom exceptions in `com.saas.core.exceptions` (e.g., `BusinessException`, `DuplicateResourceException`, `ResourceNotFoundException`).
- Global handler `GlobalExceptionHandler` returns standardized `ErrorResponse` with status/error/message/fieldErrors.
- For validation errors, rely on `MethodArgumentNotValidException` path; include field errors.
- Security exceptions bubble to Spring Security entry points; do not swallow `AccessDeniedException`/`AuthenticationException`.
- Prefer meaningful messages (no sensitive details); reuse HTTP semantics (400 validation, 404 missing, 409 conflicts).

## Security
- Spring Security present; maintain 401/403 flow; do not catch and convert to 200/500.
- Passwords encoded via injected `PasswordEncoder`; never store raw.
- JWT support in `core.security` with tests; keep secrets/config externalized in env vars.

## Persistence
- JPA entities under module packages; repositories extend Spring Data interfaces.
- When filtering by tenant, always include tenant predicate (see `UserRepository`/`UserService`).
- Use `@Transactional` for write paths; avoid lazy loading in controllers—resolve in services.

## Database Migrations (Flyway)
- Migrations in `src/main/resources/db/migration` named `V#__description.sql` (see V1..V4 examples).
- Add new schema changes via incremental version; avoid modifying existing migrations already applied.

## Logging
- Use SLF4J `LoggerFactory.getLogger(...)`; no `System.out.println`.
- Redact secrets/PII (passwords, tokens, payment references) in logs.

## Naming Conventions
- Classes: PascalCase; methods/fields: camelCase; constants: UPPER_SNAKE.
- REST endpoints: nouns, kebab-case paths; use plural resources (`/users`, `/tenants`).
- Tests: `ClassNameTest` with method names expressing scenario (JUnit 5 `@Test` display names optional).

## Testing Guidelines
- Prefer focused unit tests; integration tests with Testcontainers when touching DB/security.
- Use `@SpringBootTest` for end-to-end slices; prefer `@DataJpaTest`/`@WebMvcTest` for narrower scope when possible.
- Arrange-Act-Assert order; isolate tenant context in tests via `TenantContext` helpers or factory data.

## Transactions & Concurrency
- Use service layer as transaction boundary; avoid transactional logic in controllers.
- For updates, fetch entity, mutate, save; guard against stale data by using repository methods with tenant filters.

## JSON / Validation
- Use `@NotNull/@NotBlank/@Email` etc. on request DTOs; keep error messages user-friendly.
- Validate enums and constrained fields in DTOs; enforce length/format where meaningful.

## Controllers
- Return DTOs, not entities; mapping via MapStruct or manual adaptation in services.
- Use `ResponseEntity` for status control; leverage @Validated at class level.
- Avoid exposing internal IDs across tenants; ensure tenant scoping in queries.

## Imports & Formatting
- Order: static imports first (rare), then java.*, javax.*, org.*, com.thirdparty.*, com.saas.*.
- No wildcard imports; keep imports sorted; remove unused imports.
- Line length guideline: ~120 chars; wrap builder chains per argument for clarity.

## Lombok Usage
- Use `@Builder`, `@Getter`, `@Setter`, `@AllArgsConstructor`, `@NoArgsConstructor` on entities/DTOs where established.
- Avoid Lombok on public APIs that must remain stable if serialization is involved; prefer explicit constructors for records.
- Keep equals/hashCode consistent with identifiers (id-based for entities).

## MapStruct Notes
- Configure mappers with `componentModel = "spring"`; avoid logic in controllers.
- Use `@Mapping(target = "id", ignore = true)` when creating entities from requests if IDs are generated.

## Tenant Context
- Always derive tenant from `TenantContext.getCurrentTenantId()`; never accept tenantId from request body/query.
- Clear context appropriately in filters (see TenantContext usage in services); ensure tests set/clear context.

## Error Response Contract
- Standard structure: status (int), error (string), message (string), fieldErrors (list of field/message).
- Do not leak stack traces or SQL in messages.

## Performance / Caching
- No caching configured; if adding, prefer Spring Cache with clear eviction strategy and tenant keying.
- Pagination for list endpoints when data scale grows; avoid unbounded queries.

## Dev Services / Containers
- Testcontainers auto-starts PostgreSQL; ensure Docker daemon is running before tests.
- For CI without Docker, configure `TESTCONTAINERS_RYUK_DISABLED`/`DOCKER_HOST` only if needed; current setup assumes Docker available.

## Compose Services
- `compose.yaml` defines postgres; set env vars to match application.properties if running app against it.
- To reset local DB: `docker compose down -v && docker compose up -d` then run migrations.

## Pull Requests / Commits
- Keep changes small and scoped per module; update tests and migrations together.
- Include new tests for bug fixes/features; ensure `./gradlew test` passes before pushing.

## Missing Tools Checklist
- No Cursor rules found (`.cursor/rules/`, `.cursorrules` absent).
- No Copilot repo instructions (`.github/copilot-instructions.md` absent).

## Observability
- Spring Boot Actuator included; ensure sensitive endpoints secured; enable relevant health/info metrics when needed.

## File Paths to Know
- Source: `src/main/java/com/saas/...`
- Tests: `src/test/java/com/saas/...`
- Config: `src/main/resources/application.properties`, test override: `src/test/resources/application-test.properties`.
- Migrations: `src/main/resources/db/migration`.
- Reports: `build/reports/tests/test/index.html`.

## Checklist Before Merging
- [ ] Code compiles with `./gradlew build`.
- [ ] All tests pass (or affected tests updated) with Docker running.
- [ ] New endpoints validated for tenant scoping and error responses.
- [ ] New migrations added with correct versioning and idempotent changes.
- [ ] Logs clean of secrets/PII and noisy debug.

## How to Add a New Feature (Mini-Playbook)
- Define request/response DTOs (records) with validation annotations.
- Add controller endpoint with clear route and status codes.
- Implement service method with tenant scoping, transactions, and exception semantics.
- Map request → entity via MapStruct; save via repository; map back to response.
- Add tests: unit for service, integration for controller with Testcontainers.

## Notes for Agentic Tools
- Use Gradle wrapper (`./gradlew`) not system Gradle.
- Prefer `apply_patch`/Read/Edit tools over raw shell edits.
- Avoid modifying user-local `.idea` except when essential; do not delete existing build artifacts unless instructed.
