# 🚀 Guía Completa de Deployment - pedidosAI

Esta guía te llevará paso a paso desde cero hasta tener tu aplicación corriendo en producción **completamente gratis**.

---

## 📋 Pre-requisitos

Antes de comenzar, asegúrate de tener:

- [ ] Cuenta en [GitHub](https://github.com) (gratis)
- [ ] Cuenta en [Vercel](https://vercel.com) (gratis)
- [ ] Cuenta en [Supabase](https://supabase.com) (gratis)
- [ ] Cuenta en [Resend](https://resend.com) (gratis - 100 emails/día)
- [ ] Cuenta en [Groq](https://console.groq.com) (gratis)
- [ ] Cuenta en [Google AI Studio](https://makersuite.google.com/app/apikey) (gratis)

---

## 🔑 PASO 1: Obtener API Keys

### 1.1 Supabase (Base de datos)

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta (gratis)
3. Crea un nuevo proyecto
   - Nombre: `pedidosai` (o el que prefieras)
   - Database Password: Guarda este password (lo necesitarás)
   - Region: South America (o la más cercana)
4. Espera ~2 minutos mientras se crea el proyecto
5. Ve a **Settings → API**
6. Copia estas variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (¡MUY IMPORTANTE!)
   ```

### 1.2 Groq (Transcripción de audio)

1. Ve a [console.groq.com](https://console.groq.com)
2. Crea una cuenta (gratis)
3. Ve a **API Keys**
4. Crea una nueva key
5. Copia:
   ```
   GROQ_API_KEY=gsk_...
   ```

### 1.3 Google Gemini (Parsing de órdenes)

1. Ve a [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Click en **Get API Key**
4. Crea una API key
5. Copia:
   ```
   GEMINI_API_KEY=AIzaSy...
   ```

### 1.4 Resend (Envío de emails)

1. Ve a [resend.com](https://resend.com)
2. Crea una cuenta (gratis - 100 emails/día)
3. Ve a **API Keys**
4. Crea una nueva key
5. Copia:
   ```
   RESEND_API_KEY=re_...
   ```

### 1.5 Generar CRON_SECRET

En tu terminal, ejecuta:

```bash
openssl rand -base64 32
```

Copia el resultado:

```
CRON_SECRET=el_secret_generado
```

---

## 📝 PASO 2: Configurar Variables de Entorno Localmente

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# En tu terminal, en la raíz del proyecto:
nano .env.local
```

Pega todas las variables que copiaste:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# AI Services
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...

# Email
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron Job Security
CRON_SECRET=el_secret_que_generaste
```

**Guarda el archivo** (Ctrl+O, Enter, Ctrl+X en nano)

---

## 🗄️ PASO 3: Configurar Base de Datos en Supabase

### 3.1 Ejecutar Migraciones

En tu terminal:

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Login a Supabase
supabase login

# Link al proyecto
supabase link --project-ref tu_project_ref

# El project-ref está en la URL: https://app.supabase.com/project/[PROJECT_REF]

# Ejecutar migraciones
supabase db push
```

### 3.2 Verificar que las tablas se crearon

1. Ve a tu proyecto en Supabase
2. Table Editor → Deberías ver:
   - profiles
   - organizations
   - memberships
   - suppliers
   - orders
   - order_items
   - supplier_orders
   - jobs
   - etc.

---

## 🐙 PASO 4: Crear Repositorio en GitHub

### 4.1 Inicializar Git (si no está inicializado)

```bash
cd /home/rod/Proyects/pedidosAI

# Inicializar git
git init

# Ver estado
git status
```

### 4.2 Hacer primer commit

```bash
# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit: pedidosAI MVP with tests and cron worker"
```

### 4.3 Crear repositorio en GitHub

**Opción A: Desde la terminal con GitHub CLI**

```bash
# Instalar gh CLI (si no lo tienes)
# Ubuntu/Debian:
sudo apt install gh

# Login
gh auth login

# Crear repo
gh repo create pedidosAI --public --source=. --remote=origin --push

# Esto crea el repo y hace push automáticamente
```

**Opción B: Desde el navegador**

1. Ve a [github.com/new](https://github.com/new)
2. Nombre del repositorio: `pedidosAI`
3. Descripción: `Sistema de gestión de pedidos con IA para restaurantes`
4. Public (gratis)
5. **NO** marcar "Initialize with README" (ya tenemos código)
6. Click en **Create repository**

7. En tu terminal, conecta el repo:

```bash
git remote add origin https://github.com/TU_USUARIO/pedidosAI.git
git branch -M main
git push -u origin main
```

---

## ☁️ PASO 5: Deployar en Vercel

### 5.1 Conectar GitHub con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click en **Sign Up** o **Login**
3. Elige **Continue with GitHub**
4. Autoriza a Vercel acceder a tu cuenta de GitHub

### 5.2 Importar Proyecto

1. Click en **Add New...** → **Project**
2. Busca tu repositorio `pedidosAI`
3. Click en **Import**

### 5.3 Configurar Proyecto

**Framework Preset:** Next.js (detectado automáticamente)
**Root Directory:** ./
**Build Command:** `pnpm build` (detectado automáticamente)

### 5.4 Configurar Variables de Entorno

En la sección **Environment Variables**, agrega **TODAS** las variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
CRON_SECRET=el_secret_que_generaste
```

**⚠️ IMPORTANTE:**

- `NEXT_PUBLIC_APP_URL` déjalo vacío por ahora (lo actualizaremos después)
- Asegúrate de copiar bien el `CRON_SECRET` (lo necesitarás para GitHub)

### 5.5 Deploy

1. Click en **Deploy**
2. Espera ~2-3 minutos mientras se construye
3. ¡Listo! Tu app está en producción

### 5.6 Actualizar APP_URL

1. Copia la URL de tu app (ej: `https://pedidosai-xxx.vercel.app`)
2. En Vercel, ve a **Settings → Environment Variables**
3. Edita `NEXT_PUBLIC_APP_URL` y pega la URL de Vercel
4. Click en **Save**
5. En **Deployments** → Click en los 3 puntos del último deploy → **Redeploy**

---

## 🤖 PASO 6: Configurar GitHub Actions (Cron Job)

### 6.1 Configurar GitHub Secrets

1. Ve a tu repositorio en GitHub
2. **Settings** (del repositorio, no de tu perfil)
3. **Secrets and variables** → **Actions**
4. Click en **New repository secret**

Agrega estos 2 secrets:

**Secret 1:**

- Name: `APP_URL`
- Value: `https://pedidosai-xxx.vercel.app` (tu URL de Vercel)

**Secret 2:**

- Name: `CRON_SECRET`
- Value: `el_mismo_secret_que_pusiste_en_vercel`

⚠️ **IMPORTANTE:** El `CRON_SECRET` debe ser **EXACTAMENTE** el mismo que en Vercel

### 6.2 Verificar que el Workflow está activo

1. Ve a **Actions** en tu repo de GitHub
2. Deberías ver el workflow **Process Job Queue**
3. Si está deshabilitado, click en **Enable workflow**

### 6.3 Probar manualmente

1. Ve a **Actions** → **Process Job Queue**
2. Click en **Run workflow** → **Run workflow**
3. Espera ~10 segundos
4. Click en el run que apareció
5. Click en **process-jobs** → **Call cron endpoint**
6. Deberías ver:
   ```
   HTTP Status: 200
   Response: {"success":true,"message":"Jobs processed successfully",...}
   Jobs processed successfully
   ```

✅ Si ves esto, **el cron job funciona correctamente**

---

## 🧪 PASO 7: Probar la Aplicación

### 7.1 Crear primera cuenta

1. Ve a `https://tu-app.vercel.app`
2. Click en **Sign Up**
3. Crea una cuenta con tu email
4. Verifica el email (revisa spam si no llega)

### 7.2 Crear organización

1. Después de login, te pedirá crear una organización
2. Nombre: "Mi Restaurante"
3. Slug: "mi-restaurante" (URL amigable)

### 7.3 Agregar proveedores

1. Ve a **Proveedores**
2. Click en **Agregar Proveedor**
3. Ejemplo:
   - Nombre: Verdulería Central
   - Email: proveedor@example.com
   - Categoría: Frutas y Verduras
   - Keywords: tomate, lechuga, cebolla

### 7.4 Crear primer pedido

1. Ve a **Nueva Orden**
2. Escribe o graba:
   ```
   necesito 2 kilos de tomate, 1 kilo de cebolla y 3 lechugas
   ```
3. Click en **Procesar**
4. Revisa los items detectados
5. Click en **Enviar**

### 7.5 Verificar que se envió

1. El estado cambiará a "Sending" (Enviando)
2. Espera 5 minutos (el cron job procesa cada 5 min)
3. Recarga la página
4. El estado debería cambiar a "Sent" (Enviado)
5. El proveedor recibirá un email con el pedido

---

## 🔍 PASO 8: Monitoreo y Logs

### 8.1 Ver logs en Vercel

1. Ve a tu proyecto en Vercel
2. **Functions** → Click en cualquier función
3. Verás logs en tiempo real

### 8.2 Ver logs de Cron Job

1. GitHub → **Actions** → **Process Job Queue**
2. Click en cualquier ejecución
3. Ver logs de cada step

### 8.3 Ver jobs en la base de datos

En Supabase:

1. **SQL Editor** → **New query**
2. Ejecuta:

```sql
SELECT * FROM jobs
ORDER BY created_at DESC
LIMIT 10;
```

3. Verás todos los jobs con su estado

---

## 🆘 Troubleshooting Común

### Problema 1: "Error 401 Unauthorized" en cron job

**Causa:** CRON_SECRET no coincide entre Vercel y GitHub

**Solución:**

1. Verifica que el secret sea exactamente igual en:
   - Vercel → Environment Variables → CRON_SECRET
   - GitHub → Secrets → CRON_SECRET
2. Si los cambiaste, redeploya en Vercel

### Problema 2: Jobs quedan en "pending"

**Causa:** El cron job no se está ejecutando

**Solución:**

1. Ve a GitHub Actions
2. Verifica que el workflow esté habilitado
3. Ejecuta manualmente para probar
4. Revisa los logs

### Problema 3: "Invalid project ref" en Supabase

**Solución:**

1. Ve a Supabase → Settings → General
2. Copia el "Reference ID"
3. Usa ese ID en el comando:

```bash
supabase link --project-ref [REFERENCE_ID]
```

### Problema 4: Build falla en Vercel

**Causa común:** Variables de entorno mal configuradas

**Solución:**

1. Vercel → Settings → Environment Variables
2. Verifica que todas estén presentes
3. Especialmente `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploya

### Problema 5: No llegan los emails

**Causas posibles:**

1. Email del proveedor incorrecto
2. RESEND_API_KEY inválida
3. Jobs fallan en procesamiento

**Solución:**

1. Verifica en Supabase → Table Editor → suppliers
2. Chequea que el email sea válido
3. Ve a jobs table y mira `last_error` column
4. Verifica logs en Vercel Functions

---

## ✅ Checklist Final

Antes de considerar el deployment completo:

### Base de datos

- [ ] Proyecto Supabase creado
- [ ] Migraciones ejecutadas
- [ ] Tablas creadas correctamente
- [ ] RLS policies activas

### GitHub

- [ ] Repositorio creado
- [ ] Código pusheado
- [ ] GitHub Actions habilitado
- [ ] Secrets configurados (APP_URL, CRON_SECRET)

### Vercel

- [ ] Proyecto deployado
- [ ] Build exitoso (verde)
- [ ] Todas las variables de entorno configuradas
- [ ] APP_URL apunta a la URL de Vercel

### Funcionalidad

- [ ] App carga correctamente
- [ ] Puedes crear cuenta
- [ ] Puedes crear organización
- [ ] Puedes agregar proveedores
- [ ] Puedes crear órdenes
- [ ] Órdenes se procesan con IA
- [ ] Cron job funciona (ejecutar manualmente para probar)
- [ ] Emails se envían

### Monitoring

- [ ] Logs accesibles en Vercel
- [ ] GitHub Actions muestra ejecuciones exitosas
- [ ] Jobs en BD se procesan correctamente

---

## 💰 Costos

**TODO GRATIS:**

| Servicio      | Plan  | Límites                                | Costo |
| ------------- | ----- | -------------------------------------- | ----- |
| Vercel        | Hobby | 100GB bandwidth, ilimitados builds     | $0    |
| Supabase      | Free  | 500MB DB, 1GB bandwidth, 2GB storage   | $0    |
| GitHub        | Free  | Repos ilimitados, 2000 min Actions/mes | $0    |
| Resend        | Free  | 100 emails/día, 3000/mes               | $0    |
| Groq          | Free  | Rate limits generosos                  | $0    |
| Google Gemini | Free  | 60 requests/min                        | $0    |

**Total: $0/mes**

Con estos límites, puedes manejar:

- **~10 restaurantes**
- **~100 órdenes/día**
- **~300 emails/día** (3 proveedores promedio × 100 órdenes)

---

## 📈 Escalamiento (Futuro)

Cuando necesites más capacidad:

| Servicio | Plan Pago | Precio  | Te da                   |
| -------- | --------- | ------- | ----------------------- |
| Vercel   | Pro       | $20/mes | 1TB bandwidth           |
| Supabase | Pro       | $25/mes | 8GB DB, 250GB bandwidth |
| Resend   | Starter   | $20/mes | 50,000 emails/mes       |

---

## 🎉 ¡Listo!

Tu aplicación está ahora en producción, completamente funcional y gratis.

**URLs importantes:**

- App: `https://tu-app.vercel.app`
- GitHub: `https://github.com/tu-usuario/pedidosAI`
- Supabase: `https://app.supabase.com/project/[ref]`
- Vercel Dashboard: `https://vercel.com/dashboard`

**Próximos pasos:**

1. Invita a usuarios a probar
2. Monitorea los logs regularmente
3. Agrega más tests (cobertura actual: 30%)
4. Considera agregar Sentry para error tracking

---

**Última actualización:** 23 de Noviembre, 2025
