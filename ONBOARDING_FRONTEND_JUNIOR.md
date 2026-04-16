# Onboarding Frontend Junior + Troubleshooting rápido

Guía corta para arrancar el primer día sin desviarte de la estructura oficial.

## Checklist primer día (6 comandos exactos)

> Ejecutar **siempre desde la raíz**: `C:\Aaron_Programacion\saas`

```bash
npm run frontend:install
npm run frontend:dev
npm run frontend:build
npm run backend:dev
npm run backend:test
npm --prefix saas-frontend/frontend audit
```

## Troubleshooting breve (si falla X, hacer Y)

### 1) Si falla backend por Docker no corriendo

**Síntoma (X):** backend no levanta, errores de conexión a servicios (DB/infra local) o contenedores no disponibles.

**Acción (Y):**
1. Abrir Docker Desktop.
2. Verificar que Docker Engine esté en estado "running".
3. Reintentar levantar backend desde raíz:

```bash
npm run backend:dev
```

---

### 2) Si aparece error por instalar npm en ruta incorrecta

**Síntoma (X):** ejecutaste `npm install` en `saas-frontend/` y aparece un error de preinstall (nivel deprecado).

**Acción (Y):** usar la ruta oficial del frontend:

```bash
npm --prefix saas-frontend/frontend install
```

> Regla: `saas-frontend/package.json` está deprecado a propósito para evitar una fuente de verdad duplicada.

---

### 3) Si el build frontend termina con warnings (chunk size / leaflet)

**Síntoma (X):** `npm run frontend:build` completa pero muestra warnings de tamaño de chunks o de dependencias como `leaflet`.

**Acción (Y):**
1. Tomarlo como warning de optimización (no bloqueante).
2. Revisar lazy loading / code splitting de vistas pesadas.
3. Si aplica, ajustar `build.rollupOptions.output.manualChunks` en Vite para dividir bundles.
4. Confirmar que el build siga pasando:

```bash
npm run frontend:build
```

---

### 4) Si `npm audit` reporta vulnerabilidades

**Síntoma (X):** hay findings de seguridad en dependencias.

**Acción (Y):**
1. Ver detalle:

```bash
npm --prefix saas-frontend/frontend audit
```

2. Intentar fix automático seguro:

```bash
npm --prefix saas-frontend/frontend audit fix
```

3. Si persiste algo crítico, escalar para revisión del lockfile y/o actualización manual de dependencias.
