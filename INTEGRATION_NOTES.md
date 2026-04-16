# Notas de integración: unificación de .gitignore

## Objetivo
Dejar el proyecto preparado para operar como un solo repositorio raíz (`backend` + `saas-frontend/frontend`) con una política de ignorados consistente y sin duplicidades.

## Estrategia aplicada
- Se creó un `.gitignore` en la raíz con reglas compartidas para:
  - secretos (`.env*`, `*.env`),
  - logs,
  - artefactos de Node/Vite,
  - metadatos de IDE/SO,
  - cachés y salidas de compilación,
  - artefactos de backend Gradle.
- Se depuraron los `.gitignore` locales para que solo conserven reglas de valor estrictamente local.

## Estado por subproyecto

### backend/
- Conserva solo entradas locales de IDE/STS/NetBeans y `HELP.md`.
- Los binarios/build/cachés gradle pasan a regirse por el `.gitignore` raíz.

### saas-frontend/
- Conserva `frontend.zip` como artefacto local de ese subdirectorio.
- `node_modules`, `dist`, `.env*`, logs y afines quedan centralizados en raíz.

### saas-frontend/frontend/
- Conserva `*.local` por ser específico del runtime de frontend.
- El resto (logs, `node_modules`, `dist`, IDE, etc.) queda centralizado en raíz.

## Validación de compatibilidad para integración

### Estructura
- `backend/` (Gradle/Spring Boot) y `saas-frontend/frontend/` (Vite/React) coexisten sin colisión de ignorados.

### Artefactos ignorados
- Node: `node_modules`, `dist`, `dist-ssr`, caches y logs cubiertos globalmente.
- Java/Gradle: `backend/.gradle`, `backend/build`, `backend/bin`, `backend/out` cubiertos globalmente.
- Secretos: `.env*` y `*.env` ignorados a nivel raíz (con excepción para `.env.example`).

### Herramientas y lockfiles
- Detectado `package-lock.json` en `saas-frontend/` y en `saas-frontend/frontend/`.
- No se detecta `yarn.lock` ni `pnpm-lock.yaml`.
- Recomendación: estandarizar un único gestor para integración (actualmente npm es consistente con lockfile presente).

## Decisiones pendientes del desarrollador
1. Decidir si `frontend.zip` debe versionarse (actualmente se ignora localmente).
2. Si se unifica CI en raíz, definir scripts raíz (`build`, `test`, `lint`) para ambos subproyectos.

---

## Actualización aplicada (limpieza para integración)

- Se definió una única ruta oficial de frontend: `saas-frontend/frontend`.
- `saas-frontend/package.json` quedó deprecado de forma explícita y bloquea `npm install` en ese nivel para evitar errores de onboarding.
- Se eliminó `saas-frontend/package-lock.json` para quitar el doble lockfile de npm.
- Se creó `package.json` en raíz con scripts simples para frontend/backend.
- Se creó `README_INTEGRACION.md` con pasos copy-paste para equipo junior.
