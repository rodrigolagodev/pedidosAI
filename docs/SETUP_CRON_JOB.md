# Configuración del Cron Job para Procesamiento de Jobs

Este documento explica cómo configurar el worker gratuito para procesar jobs en segundo plano.

## 🎯 Propósito

El sistema usa una cola de jobs (tabla `jobs` en la BD) para procesar tareas asíncronas como:

- Envío de emails a proveedores
- Notificaciones
- Procesamiento pesado

El cron job externo ejecuta el endpoint `/api/cron/process-jobs` cada 5 minutos para procesar jobs pendientes.

---

## 🔧 Configuración

### 1. Variables de Entorno

Agrega a tu archivo `.env.local`:

```bash
# Cron Job Security
CRON_SECRET=generate_a_random_secret_min_32_characters
```

**Generar un secret seguro:**

```bash
# En Linux/Mac:
openssl rand -base64 32

# En Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. GitHub Actions (GRATIS)

El repositorio ya incluye el workflow en `.github/workflows/process-jobs.yml`.

#### Configurar Secrets en GitHub:

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Agrega los siguientes secrets:

| Secret Name   | Valor                          | Descripción                        |
| ------------- | ------------------------------ | ---------------------------------- |
| `APP_URL`     | `https://tu-app.vercel.app`    | URL de tu aplicación en producción |
| `CRON_SECRET` | El secret que generaste arriba | Token de seguridad para el cron    |

#### Activar GitHub Actions:

1. Asegúrate que GitHub Actions esté habilitado en tu repo:
   - Settings → Actions → General
   - Allow all actions and reusable workflows

2. El workflow se ejecutará automáticamente cada 5 minutos

3. Para probarlo manualmente:
   - Actions → Process Job Queue → Run workflow

---

## 🧪 Probar Localmente

### Opción 1: Llamar el endpoint directamente

```bash
curl -X GET http://localhost:3000/api/cron/process-jobs \
  -H "Authorization: Bearer tu_cron_secret"
```

### Opción 2: Simular un job

```typescript
// En tu código o en la consola del navegador
await fetch('/api/cron/process-jobs', {
  method: 'GET',
  headers: {
    Authorization: 'Bearer ' + process.env.CRON_SECRET,
  },
});
```

---

## 📊 Monitoreo

### Ver logs en GitHub Actions:

1. Actions → Process Job Queue
2. Click en la ejecución más reciente
3. Ver logs de "Call cron endpoint"

### Ver jobs en la base de datos:

```sql
-- Ver jobs pendientes
SELECT * FROM jobs WHERE status = 'pending';

-- Ver jobs fallidos
SELECT * FROM jobs WHERE status = 'failed';

-- Ver historial de jobs
SELECT type, status, created_at, updated_at, last_error
FROM jobs
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔄 Alternativas de Cron (si GitHub Actions no funciona)

### Opción 2: Vercel Cron (Requiere plan Pro - $20/mes)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-jobs",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Opción 3: EasyCron (Plan gratis: 20 ejecuciones/día)

1. Registrarse en https://www.easycron.com
2. Crear cron job:
   - URL: `https://tu-app.vercel.app/api/cron/process-jobs`
   - Schedule: `*/5 * * * *` (cada 5 minutos)
   - Headers: `Authorization: Bearer tu_cron_secret`

### Opción 4: cron-job.org (Gratis, sin límites)

1. Registrarse en https://cron-job.org
2. Create new cron job:
   - URL: `https://tu-app.vercel.app/api/cron/process-jobs`
   - Schedule: Every 5 minutes
   - Headers: Add `Authorization: Bearer tu_cron_secret`

---

## 🚨 Troubleshooting

### El cron job falla con 401 Unauthorized

**Causa:** CRON_SECRET no coincide

**Solución:**

1. Verifica que el secret en GitHub Actions coincida con `.env`
2. Asegúrate de usar el mismo secret en producción

### Jobs quedan en estado 'pending'

**Causa:** El cron job no se está ejecutando o está fallando

**Solución:**

1. Verifica logs en GitHub Actions
2. Verifica que APP_URL apunte a la URL correcta
3. Prueba el endpoint manualmente con curl

### Jobs fallan con errores de email

**Causa:** RESEND_API_KEY inválida o email del proveedor incorrecto

**Solución:**

1. Verifica que RESEND_API_KEY esté configurada
2. Revisa los emails de los proveedores en la BD
3. Chequea logs: `SELECT last_error FROM jobs WHERE status = 'failed'`

### El cron job no se ejecuta cada 5 minutos

**Causa:** GitHub Actions puede tener delay en schedules (común)

**Solución:**

- GitHub no garantiza ejecución exacta cada 5 min (puede ser 5-15 min)
- Para garantías estrictas, usar alternativa paga (Vercel Cron, EasyCron Pro)
- O ejecutar manualmente desde Actions cuando sea crítico

---

## 📈 Escalabilidad

### Frecuencia actual: cada 5 minutos

- **Capacidad:** ~1000 jobs/día (asumiendo 5 jobs/batch × 288 ejecuciones/día)
- **Latencia:** Máximo 5 minutos entre envío y procesamiento

### Si necesitas más throughput:

1. **Reducir frecuencia a 1 minuto:**

   ```yaml
   schedule:
     - cron: '* * * * *' # Cada minuto
   ```

2. **Aumentar batch size:**

   ```typescript
   // src/services/queue.ts:71
   .limit(10);  // En vez de 5
   ```

3. **Migrar a worker dedicado** (cuando escales):
   - Railway (plan Hobby: $5/mes)
   - Render (plan Starter: $7/mes)
   - Fly.io (plan gratis limitado)

---

## ✅ Checklist de Deployment

Antes de hacer deploy a producción:

- [ ] CRON_SECRET generado y agregado a `.env.local`
- [ ] CRON_SECRET agregado a Vercel/hosting como variable de entorno
- [ ] APP_URL y CRON_SECRET configurados en GitHub Secrets
- [ ] GitHub Actions habilitado en el repositorio
- [ ] Workflow ejecutado manualmente desde GitHub para probar
- [ ] Verificar que jobs se procesan correctamente en BD
- [ ] Monitoring configurado (opcional: agregar Sentry)

---

**Última actualización:** 23 de Noviembre, 2025
