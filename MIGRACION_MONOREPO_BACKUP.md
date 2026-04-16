# Nota de riesgo — migración a monorepo único

Se realizó la migración a monorepo eliminando metadata Git embebida en:

- `backend/.git`
- `saas-frontend/.git`

## Riesgo identificado

Al eliminar esos directorios `.git` se pierde el historial local independiente de cada repo embebido en este workspace.

## Recomendación de backup (para futuras migraciones)

Antes de eliminar repos embebidos, generar un respaldo de historial por cada módulo:

```bash
git -C backend bundle create ../backup-backend.bundle --all
git -C saas-frontend bundle create ../backup-frontend.bundle --all
```

o, alternativamente, guardar copia de cada carpeta `.git` (`backend/.git` y `saas-frontend/.git`) fuera del workspace.

## Rollback de historial

Si se necesita recuperar historial independiente después de esta migración, usar una copia/backup previo o re-clonar los repos originales desde su remoto y extraer historial desde allí.
