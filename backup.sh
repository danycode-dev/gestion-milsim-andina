#!/bin/bash
set -euo pipefail

# Configuración desde variables de entorno
NODE_ENV="${NODE_ENV:-development}"
BACKUP_INTERVAL="${BACKUP_INTERVAL:-86400}"

# Solo realizar backups en producción
if [ "$NODE_ENV" != "production" ]; then
    echo "[$(date)] Entorno '$NODE_ENV': backups desactivados."
    exit 0
fi

mkdir -p /backups

while true; do
    DATE=$(date +%Y-%m-%d_%H-%M-%S)
    FILE="/backups/milsim_${DATE}.dump"
    TEMP="${FILE}.tmp"

    echo "[$(date)] Iniciando backup..."

    if pg_dump -Fc -f "$TEMP" &&
       pg_restore --list "$TEMP" > /dev/null; then

        mv "$TEMP" "$FILE"
        echo "[$(date)] Backup exitoso: $FILE"

        # Eliminar backups de más de 14 días
        find /backups -type f -name "milsim_*.dump" \
          -mtime +13 -delete
    else
        rm -f "$TEMP"
        echo "[$(date)] ERROR: Backup fallido" >&2
    fi

    # Esperar el intervalo configurado
    sleep "$BACKUP_INTERVAL"
done