# Arquitectura de Cola de Emails - PedidosAI

**Fecha:** 26 de Noviembre, 2025
**Estado:** Propuesto
**Autor:** Equipo PedidosAI
**Versión:** 1.0

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Contexto y Problema](#contexto-y-problema)
3. [Decisión: Solución Elegida](#decisión-solución-elegida)
4. [Arquitectura del Nuevo Flujo](#arquitectura-del-nuevo-flujo)
5. [Componentes del Sistema](#componentes-del-sistema)
6. [Reglas de Negocio](#reglas-de-negocio)
7. [Lineamientos de Implementación](#lineamientos-de-implementación)
8. [Manejo de Errores y Reintentos](#manejo-de-errores-y-reintentos)
9. [Monitoreo y Observabilidad](#monitoreo-y-observabilidad)
10. [Plan de Migración](#plan-de-migración)
11. [Criterios de Éxito](#criterios-de-éxito)
12. [Riesgos y Mitigaciones](#riesgos-y-mitigaciones)

---

## 1. Resumen Ejecutivo

### Decisión

Migrar el sistema de envío de emails de **Vercel Cron Jobs** a **Supabase Database Triggers + Edge Functions** con feedback en tiempo real vía **Supabase Realtime**.

### Motivación

- **Latencia inaceptable:** Cron jobs cada hora generan espera de hasta 60 minutos
- **Limitación técnica:** Plan Hobby de Vercel no permite cron jobs frecuentes
- **UX deficiente:** Usuario no recibe feedback de envío inmediato
- **Costo-beneficio:** Solución con $0 costo adicional

### Resultado Esperado

- Procesamiento de emails en **< 2 segundos** (vs 60 minutos actual)
- Feedback en tiempo real para el usuario
- Sistema escalable hasta 500k envíos/mes
- Arquitectura resiliente con fallback

---

## 2. Contexto y Problema

### Sistema Actual

**Flujo:**

```
Usuario finaliza orden → Server Action crea jobs en DB → Vercel Cron (cada hora) → Procesa jobs → Envía emails
```

**Problemas identificados:**

1. **Latencia alta:** Entre 0 y 60 minutos de espera
2. **Sin feedback:** Usuario no sabe si el email se envió
3. **Limitación de plan:** Vercel Hobby solo permite cron diario
4. **Solución temporal:** Cambio a cron cada hora no resuelve UX
5. **No escalable:** Cron jobs no son la solución para colas de mensajes

### Requisitos del Negocio

1. **Tiempo de envío:** Emails deben enviarse en < 5 segundos
2. **Confirmación:** Usuario debe ver confirmación de envío
3. **Confiabilidad:** 99.9% de emails deben enviarse correctamente
4. **Retry:** Fallos temporales deben reintentarse automáticamente
5. **Costo:** Solución debe ser costo-efectiva (preferible $0)
6. **Escalabilidad:** Soportar hasta 10,000 órdenes/día

---

## 3. Decisión: Solución Elegida

### Supabase Triggers + Edge Functions + Realtime

**Componentes:**

1. **Database Triggers:** Ejecutan automáticamente al insertar job
2. **Edge Functions:** Procesan el envío de email
3. **Realtime Subscriptions:** Notifican al cliente cuando termina
4. **Fallback Cron:** Vercel Cron como respaldo (cada hora)

### Por Qué Esta Solución

#### Ventajas Técnicas

- **Instantáneo:** Trigger ejecuta inmediatamente (< 100ms)
- **Sin infraestructura adicional:** Todo en Supabase
- **Realtime built-in:** Supabase Realtime ya está disponible
- **Type-safe:** Edge Functions usan TypeScript
- **Serverless:** No necesita mantener workers corriendo

#### Ventajas de Negocio

- **Costo $0:** Incluido en plan actual de Supabase
- **Mejor UX:** Feedback inmediato al usuario
- **Confiable:** PostgreSQL triggers son extremadamente confiables
- **Escalable:** Free tier soporta 500k invocaciones/mes
- **Mantenible:** Stack unificado (todo en Supabase)

#### Comparación con Alternativas Descartadas

| Solución                 | Por Qué NO                                             |
| ------------------------ | ------------------------------------------------------ |
| **Redis + BullMQ**       | Costo adicional ($20-40/mes), infraestructura compleja |
| **Inngest**              | Vendor lock-in, costo después de 1000 jobs/mes         |
| **QStash**               | Latencia ~2s, menos features que triggers              |
| **Vercel Cron Pro**      | $20/mes solo para cron jobs, overkill                  |
| **Client-side Realtime** | No confiable (depende del navegador)                   |

---

## 4. Arquitectura del Nuevo Flujo

### Diagrama de Flujo

```
┌─────────────┐
│   Usuario   │
│ (Finaliza)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Server Action      │
│  finalizeOrder()    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ OrderService        │
│ createSupplier      │
│ Orders()            │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  JobQueue.enqueue() │
│  INSERT job en DB   │
└──────┬──────────────┘
       │
       ├──────────────────────┐
       │                      │
       ▼                      ▼
┌──────────────┐      ┌────────────────┐
│ PostgreSQL   │      │ Realtime       │
│ TRIGGER      │      │ Broadcast      │
│ (inmediato)  │      │ (websocket)    │
└──────┬───────┘      └───────┬────────┘
       │                      │
       ▼                      ▼
┌──────────────┐      ┌────────────────┐
│ Supabase     │      │ Cliente React  │
│ Edge         │      │ (escucha)      │
│ Function     │      └────────────────┘
└──────┬───────┘              │
       │                      │
       ▼                      │
┌──────────────┐              │
│ Resend API   │              │
│ (envía email)│              │
└──────┬───────┘              │
       │                      │
       ▼                      │
┌──────────────┐              │
│ UPDATE       │              │
│ supplier_    │──────────────┘
│ orders       │    (notifica éxito)
│ status='sent'│
└──────────────┘

┌──────────────────────┐
│ FALLBACK             │
│ Vercel Cron (1 hora) │
│ Procesa jobs pending │
└──────────────────────┘
```

### Flujo Detallado

#### Paso 1: Creación de Jobs (Sin cambios)

- Server Action crea supplier orders
- JobQueue inserta registros en tabla `jobs`
- Estado inicial: `pending`

#### Paso 2: Trigger Automático (NUEVO)

- PostgreSQL detecta INSERT en tabla `jobs`
- Trigger ejecuta función `notify_new_job()`
- Función llama a Edge Function vía HTTP POST

#### Paso 3: Procesamiento (NUEVO)

- Edge Function recibe payload del job
- Obtiene datos de supplier order y supplier
- Genera HTML del email
- Llama a Resend API
- Actualiza estado del job

#### Paso 4: Feedback Real-time (NUEVO)

- Edge Function actualiza `supplier_orders.status`
- Supabase Realtime notifica a clientes suscritos
- UI muestra toast de confirmación

#### Paso 5: Fallback (Existente mejorado)

- Vercel Cron ejecuta cada hora
- Procesa SOLO jobs que quedaron en `pending` por > 5 minutos
- Marca jobs con demasiados fallos como `failed`

---

## 5. Componentes del Sistema

### 5.1 Database Trigger

**Ubicación:** Supabase Dashboard → SQL Editor

**Responsabilidad:**

- Detectar nuevos jobs insertados
- Llamar a Edge Function automáticamente
- NO bloquear la inserción (ejecución asíncrona)

**Reglas:**

- SOLO ejecutar en INSERT (no UPDATE)
- SOLO para jobs con `status = 'pending'`
- Usar `AFTER INSERT` (no BEFORE)
- Manejo de errores debe ser silencioso (no debe fallar INSERT)

### 5.2 Edge Function

**Ubicación:** `supabase/functions/process-job/`

**Responsabilidad:**

- Recibir notificación de nuevo job
- Obtener datos necesarios de la base de datos
- Generar contenido del email
- Enviar email vía Resend API
- Actualizar estados en base de datos
- Manejar errores y logging

**Reglas:**

- Timeout máximo: 45 segundos (límite de 50s de Supabase)
- Debe ser idempotente (puede ejecutarse múltiples veces)
- Debe usar Service Role Key (no anon key)
- Debe validar payload recibido
- Debe actualizar `jobs.status` SIEMPRE (success o failed)

### 5.3 Realtime Subscriptions

**Ubicación:** Componentes React en cliente

**Responsabilidad:**

- Suscribirse a cambios en `supplier_orders`
- Mostrar notificaciones al usuario
- Actualizar UI en tiempo real
- Cerrar subscripción al desmontar componente

**Reglas:**

- Suscribirse SOLO a órdenes del usuario actual
- Filtrar por `user_id` para seguridad
- Usar `useEffect` con cleanup
- Mostrar feedback visual (toast/notificación)
- NO ejecutar lógica de negocio (solo UI)

### 5.4 Vercel Cron (Fallback)

**Ubicación:** `src/app/api/cron/process-jobs/`

**Responsabilidad:**

- Procesar jobs que fallaron en trigger
- Retry de jobs con errores temporales
- Limpieza de jobs antiguos

**Reglas:**

- Ejecutar cada hora (límite de Hobby plan)
- SOLO procesar jobs con `status = 'pending'` y `created_at > 5 minutos`
- Marcar como `failed` después de 3 intentos
- NO reprocesar jobs `completed` o `failed` definitivamente

---

## 6. Reglas de Negocio

### 6.1 Estados de Jobs

**Estados permitidos:**

- `pending`: Job recién creado, esperando procesamiento
- `processing`: Job siendo procesado actualmente (opcional)
- `completed`: Job procesado exitosamente
- `failed`: Job falló definitivamente (después de 3 intentos)

**Transiciones válidas:**

```
pending → processing → completed
pending → processing → failed (después de 3 intentos)
pending → completed (si se procesa en primer intento)
```

**Transiciones prohibidas:**

- `completed` → cualquier otro estado (inmutable)
- `failed` → `pending` (no retry automático de failed definitivos)

### 6.2 Retry Policy

**Regla de reintentos:**

- Primer intento: Inmediato (via trigger)
- Segundo intento: Cron job (máximo 1 hora después)
- Tercer intento: Siguiente cron job (2 horas después)
- Después de 3 intentos: Marcar como `failed` definitivo

**Condiciones para retry:**

- SOLO errores 5xx de Resend API (server errors)
- SOLO si `attempts < 3`
- NO retry para errores 4xx (client errors: email inválido, etc.)

**Backoff strategy:**

- No hay backoff exponencial (cron es cada hora)
- Aceptable porque no es crítico que tarde 1-2 horas en casos excepcionales

### 6.3 Idempotencia

**Requisito crítico:** Edge Function debe ser idempotente

**Implementación:**

- Verificar si `job.status != 'pending'` antes de procesar
- Si ya está `completed`, retornar éxito sin reprocesar
- Si está `processing` por > 60s, asumir timeout y reprocesar
- Usar `job.id` como idempotency key en Resend (si API lo soporta)

### 6.4 Timeouts

**Límites de tiempo:**

- Edge Function: Máximo 45 segundos de ejecución
- Resend API call: Timeout de 30 segundos
- Database queries: Timeout de 10 segundos

**Qué hacer si se excede:**

- Marcar job como `failed` con error específico
- Logging detallado para debugging
- Retry automático vía cron

---

## 7. Lineamientos de Implementación

### 7.1 Fase 1: Preparación (1-2 horas)

**Objetivo:** Preparar infraestructura sin romper sistema actual

**Tareas:**

1. Crear estructura de carpetas `supabase/functions/process-job/`
2. Configurar variables de entorno en Supabase
3. Crear índices optimizados en tabla `jobs`
4. Documentar flujo actual como baseline

**No hacer:**

- NO modificar código existente de Server Actions
- NO eliminar Vercel Cron todavía
- NO cambiar schema de base de datos

### 7.2 Fase 2: Edge Function (2-3 horas)

**Objetivo:** Crear y deployar Edge Function funcional

**Tareas:**

1. Implementar lógica de procesamiento de jobs
2. Integrar con Resend API
3. Implementar manejo de errores robusto
4. Añadir logging estructurado
5. Escribir tests unitarios (mocks de Supabase y Resend)
6. Deploy a Supabase en entorno de pruebas

**Validaciones:**

- Probar con jobs de prueba manualmente
- Verificar que actualiza estados correctamente
- Confirmar que maneja errores sin crashes
- Revisar logs en Supabase Dashboard

### 7.3 Fase 3: Database Trigger (1 hora)

**Objetivo:** Conectar inserción de jobs con Edge Function

**Tareas:**

1. Crear función SQL `notify_new_job()`
2. Crear trigger `on_job_inserted`
3. Configurar permisos y seguridad
4. Probar trigger con INSERT manual

**Validaciones:**

- Insertar job de prueba y verificar que trigger ejecuta
- Verificar que Edge Function recibe notificación
- Confirmar que no bloquea INSERT si Edge Function falla
- Revisar performance (debe ser < 100ms overhead)

### 7.4 Fase 4: Realtime UI (2 horas)

**Objetivo:** Añadir feedback en tiempo real al usuario

**Tareas:**

1. Crear hook `useOrderEmailStatus`
2. Integrar en componente de confirmación
3. Añadir toasts/notificaciones visuales
4. Manejar desconexión de websocket

**Validaciones:**

- Usuario ve notificación cuando email se envía
- Funciona en múltiples tabs/ventanas
- Maneja reconexión si pierde internet
- No consume memoria (cleanup correcto)

### 7.5 Fase 5: Testing en Producción (1 día)

**Objetivo:** Validar en producción con tráfico real limitado

**Estrategia:**

1. Activar SOLO para 1 organización (beta tester)
2. Monitorear logs y métricas por 24 horas
3. Recoger feedback del usuario
4. Validar que Vercel Cron sigue funcionando como fallback

**Métricas a monitorear:**

- Latencia promedio de envío
- Tasa de éxito/fallo
- Uso de invocaciones de Edge Functions
- Errores en logs

### 7.6 Fase 6: Rollout Completo (1 semana)

**Objetivo:** Activar para todas las organizaciones gradualmente

**Estrategia:**

1. Día 1-2: 10% de organizaciones
2. Día 3-4: 50% de organizaciones
3. Día 5-6: 100% de organizaciones
4. Día 7: Monitoreo post-rollout

**Feature flag:**

- Usar variable de entorno `ENABLE_REALTIME_JOBS`
- Configurar por organización en DB
- Fallback automático a Vercel Cron si está desactivado

### 7.7 Fase 7: Deprecación de Cron Principal (1 mes después)

**Objetivo:** Mantener solo cron como fallback

**Tareas:**

1. Confirmar que 99.9% de jobs se procesan vía trigger
2. Modificar cron para SOLO procesar jobs > 5 minutos
3. Reducir frecuencia de cron a cada 6 horas (opcional)
4. Documentar cron como sistema de respaldo

**NO hacer:**

- NO eliminar Vercel Cron completamente
- NO asumir que triggers nunca fallan

---

## 8. Manejo de Errores y Reintentos

### 8.1 Clasificación de Errores

**Errores Transitorios (Retriable):**

- Timeout de red al llamar Resend API
- Rate limit de Resend (429)
- Errores 5xx de Resend
- Timeout de Edge Function

**Errores Permanentes (No Retriable):**

- Email inválido (400 de Resend)
- API key inválida (401 de Resend)
- Supplier no tiene email
- Job no existe en base de datos

### 8.2 Estrategia de Retry

**Para errores transitorios:**

1. Edge Function marca job como `pending` (reset)
2. Incrementa `jobs.attempts`
3. Vercel Cron lo reintentará en máximo 1 hora
4. Si `attempts >= 3`, marcar como `failed`

**Para errores permanentes:**

1. Edge Function marca job como `failed` inmediatamente
2. Guardar error en `jobs.error_message`
3. NO incrementar `attempts` (no tiene sentido reintentar)
4. Notificar vía log para revisión manual

### 8.3 Logging

**Requisitos de logging:**

- Usar structured logging (JSON)
- Incluir `job_id`, `supplier_order_id`, `attempt_number`
- Diferenciar entre INFO, WARN, ERROR
- Logging tanto en Edge Function como en Vercel Cron

**Qué loguear:**

- Inicio y fin de procesamiento de job
- Llamadas a APIs externas (Resend)
- Errores con stack trace completo
- Métricas de performance (latencia)

---

## 9. Monitoreo y Observabilidad

### 9.1 Métricas Clave

**Performance:**

- P50, P95, P99 de latencia de envío de email
- Tiempo promedio desde INSERT hasta email enviado
- Throughput (jobs/segundo procesados)

**Confiabilidad:**

- Tasa de éxito (success rate)
- Tasa de retry
- Jobs en estado `failed` definitivo
- Uptime de Edge Function

**Costos:**

- Invocaciones de Edge Function/día
- Mensajes de Realtime/día
- Comparación con límites de free tier

### 9.2 Alertas

**Alertas críticas (Slack/Email inmediato):**

- Tasa de fallo > 10%
- Edge Function no responde por > 5 minutos
- Jobs pendientes > 100 (indicador de problema sistémico)

**Alertas de warning:**

- Latencia P95 > 5 segundos
- Uso de Edge Functions > 80% del free tier
- Jobs con 2 intentos fallidos (antes de marcar como failed)

### 9.3 Dashboards

**Dashboard en Supabase:**

- Logs de Edge Function en tiempo real
- Gráficas de invocaciones/hora
- Errores agrupados por tipo

**Dashboard en aplicación:**

- Panel admin para ver jobs fallidos
- Estadísticas de envío por organización
- Historial de envíos recientes

---

## 10. Plan de Migración

### 10.1 Pre-Migración

**Checklist:**

- [ ] Backup completo de base de datos
- [ ] Documentar comportamiento actual (baseline)
- [ ] Configurar variables de entorno en Supabase
- [ ] Crear feature flag `ENABLE_REALTIME_JOBS`
- [ ] Notificar a usuarios beta testers

### 10.2 Durante Migración

**Estrategia de despliegue:**

- Blue-Green deployment NO es necesario (additive change)
- Trigger y Edge Function son aditivos (no rompen flujo actual)
- Vercel Cron sigue funcionando como antes
- Trigger procesa jobs nuevos, Cron procesa todos

**Rollback plan:**

- Si Edge Function tiene > 20% error rate, deshabilitar trigger
- Vercel Cron automáticamente toma control
- NO hay pérdida de datos (jobs siguen en DB)

### 10.3 Post-Migración

**Validaciones:**

- Comparar métricas pre/post migración
- Validar que no hay regresión en tasa de éxito
- Confirmar que latencia mejoró significativamente
- Recoger feedback de usuarios

**Limpieza:**

- Después de 1 mes sin incidentes, reducir frecuencia de cron
- Documentar sistema nuevo como fuente de verdad
- Archivar código antiguo (no eliminar)

---

## 11. Criterios de Éxito

### 11.1 Métricas de Éxito

**Objetivo primario:**

- ✅ Latencia P95 de envío < 5 segundos (vs 60 minutos actual)

**Objetivos secundarios:**

- ✅ Tasa de éxito ≥ 99.5% (igual o mejor que actual)
- ✅ Usuario recibe confirmación visual en < 3 segundos
- ✅ Costo adicional = $0
- ✅ Cero downtime durante migración

### 11.2 Validación de Usuario

**UX mejorado:**

- Usuario ve toast "Email enviado" inmediatamente
- No hay confusión sobre si el email se envió
- No hay necesidad de recargar página para ver estado

### 11.3 Validación Técnica

**Arquitectura:**

- Sistema pasa de sincronización batch a event-driven
- Código es más testeable (Edge Function aislada)
- Logs estructurados permiten mejor debugging

---

## 12. Riesgos y Mitigaciones

### 12.1 Riesgos Identificados

**Riesgo 1: Edge Function tiene bugs y falla constantemente**

- **Probabilidad:** Media
- **Impacto:** Alto
- **Mitigación:** Testing exhaustivo pre-deploy, feature flag para rollback
- **Contingencia:** Vercel Cron toma control automáticamente

**Riesgo 2: Trigger causa lentitud en INSERT de jobs**

- **Probabilidad:** Baja
- **Impacto:** Medio
- **Mitigación:** Trigger es AFTER INSERT (no bloquea), ejecución asíncrona
- **Contingencia:** Deshabilitar trigger, volver a Vercel Cron

**Riesgo 3: Exceder límite de free tier de Supabase**

- **Probabilidad:** Baja
- **Impacto:** Medio (costos inesperados)
- **Mitigación:** Monitoreo de uso, alertas al 80% del límite
- **Contingencia:** Upgrade a plan paid ($25/mes) o optimizar llamadas

**Riesgo 4: Realtime websocket consume demasiados recursos en cliente**

- **Probabilidad:** Baja
- **Impacto:** Bajo
- **Mitigación:** Cleanup correcto en useEffect, filtros eficientes
- **Contingencia:** Hacer Realtime opcional (polling como fallback)

**Riesgo 5: Resend API cambia y rompe integración**

- **Probabilidad:** Muy baja
- **Impacto:** Alto
- **Mitigación:** Usar SDK oficial de Resend, versionado de API
- **Contingencia:** Logs permiten detectar y fix rápido

### 12.2 Plan de Contingencia General

**Si todo falla:**

1. Deshabilitar trigger vía SQL (1 comando)
2. Vercel Cron continúa procesando todos los jobs
3. Sistema vuelve a comportamiento anterior
4. Debugging offline sin impacto a usuarios

---

## 13. Documentación y Mantenimiento

### 13.1 Documentación Requerida

**Documentos a crear:**

- [ ] Runbook de operaciones (cómo revisar logs, reintentar jobs)
- [ ] Guía de troubleshooting (errores comunes y soluciones)
- [ ] Diagrama de arquitectura actualizado
- [ ] Changelog con fechas de cambios

### 13.2 Mantenimiento Continuo

**Tareas recurrentes:**

- Mensual: Revisar jobs en estado `failed` para patrones
- Trimestral: Analizar métricas y optimizar si es necesario
- Anual: Re-evaluar solución vs alternativas (BullMQ, Inngest)

### 13.3 Conocimiento del Equipo

**Training necesario:**

- Cómo funcionan Database Triggers en PostgreSQL
- Cómo deployar y debuggear Edge Functions
- Cómo usar Supabase Realtime en React

---

## 14. Apéndices

### 14.1 Límites Técnicos

**Supabase Free Tier:**

- Edge Functions: 500,000 invocaciones/mes
- Realtime: 200 conexiones simultáneas
- Database: 500 MB storage
- Bandwidth: 5 GB/mes

**Cálculo de capacidad:**

- 10,000 órdenes/mes × 3 proveedores promedio = 30,000 jobs
- Margin de seguridad: 16x antes de exceder free tier ✅

### 14.2 Dependencias

**Servicios externos:**

- Supabase (database, Edge Functions, Realtime)
- Resend (envío de emails)
- Vercel (hosting, fallback cron)

**Bibliotecas:**

- Supabase JS SDK
- Resend SDK (a usar en Edge Function)

### 14.3 Referencias

**Documentación oficial:**

- [Supabase Database Triggers](https://supabase.com/docs/guides/database/postgres/triggers)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Resend API](https://resend.com/docs)

---

## 15. Aprobación y Sign-off

**Documento revisado por:**

- [ ] Tech Lead
- [ ] Backend Engineer
- [ ] Product Owner
- [ ] DevOps/Infrastructure

**Fecha de implementación acordada:** ********\_********

**Responsable de implementación:** ********\_********

**Responsable de monitoreo post-deploy:** ********\_********

---

**Fin del documento**
