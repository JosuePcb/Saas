# Guía breve: próximos pasos de integración (backend + frontend)

## 1) Estructura final (ya definida)
- `backend/` se mantiene como módulo Spring Boot (Gradle).
- Frontend oficial único: `saas-frontend/frontend/`.
- `saas-frontend/package.json` permanece deprecado para bloquear instalaciones en ruta incorrecta.

## 2) Estandarizar comandos en raíz
Crear scripts raíz (o task runner) para ejecutar en conjunto:
- `backend`: `./gradlew test`, `./gradlew build`
- `frontend`: `npm run lint`, `npm run build`

## 3) CI/CD unificado
- Pipeline con jobs separados (backend/frontend) y reporte único.
- Cachear dependencias:
  - Gradle cache (`~/.gradle`)
  - npm cache por lockfile (`package-lock.json`)

## 4) Gestión de variables de entorno segura
- Mantener `.env*` y secretos fuera de control de versiones (ya cubierto en `.gitignore` raíz).
- Versionar solo plantillas: `.env.example`.
- Definir convención de variables compartidas entre backend y frontend.

## 5) Lockfiles y gestor de paquetes
- Lockfile activo oficial: `saas-frontend/frontend/package-lock.json`.
- `saas-frontend/package-lock.json` fue eliminado para evitar doble fuente de verdad.

## 6) Limpieza operativa recomendada
- Verificar que no queden artefactos no deseados trackeados (dist, build, logs).
- Revisar que los `.gitignore` locales se mantengan mínimos y sin duplicar reglas globales.

## 7) Decisiones pendientes
1. ¿`frontend.zip` debe permanecer en el repositorio o moverse a releases/artefactos externos?
2. ¿Se implementará un comando raíz único (`build`, `test`, `lint`) para desarrolladores y CI?

---

## Actualización aplicada (estado actual)

- `saas-frontend/package.json` quedó **deprecado de forma explícita** (bloquea `npm install` en ese nivel).
- La ruta oficial única para frontend es: `saas-frontend/frontend`.
- Se eliminó `saas-frontend/package-lock.json` para evitar doble fuente de verdad.
- Se añadió `package.json` en raíz con scripts simples:
  - `frontend:install`
  - `frontend:dev`
  - `frontend:build`
  - `backend:dev`
  - `backend:test`
