# README de Integración (Frontend + Backend)

Guía mínima para correr el proyecto sin confusión.

## Estructura oficial

- Backend: `backend`
- Frontend oficial: `saas-frontend/frontend`

> `saas-frontend/package.json` está deprecado a propósito y NO es la fuente de verdad.

---

## Requisitos

- Node.js 18+
- npm 9+
- Java 17+

---

## 1) Instalar frontend (copy-paste)

Desde la **raíz** del proyecto (`C:\Aaron_Programacion\saas`):

```bash
npm run frontend:install
```

---

## 2) Levantar frontend (copy-paste)

```bash
npm run frontend:dev
```

---

## 3) Levantar backend (copy-paste)

```bash
npm run backend:dev
```

---

## 4) Build frontend (copy-paste)

```bash
npm run frontend:build
```

---

## 5) Tests backend (copy-paste)

```bash
npm run backend:test
```

---

## Notas importantes

- No ejecutes `npm install` dentro de `saas-frontend/` (nivel intermedio).
- Usa siempre la raíz del repo con los scripts anteriores.
- Los archivos `.env*` están ignorados por seguridad.

## Complemento para onboarding junior

- Ver `ONBOARDING_FRONTEND_JUNIOR.md` para checklist de primer día y troubleshooting rápido.
