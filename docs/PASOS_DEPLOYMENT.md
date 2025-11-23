# 🚀 Pasos para Deploy - pedidosAI

## ✅ Ya completado:

- [x] Código listo y commit hecho
- [x] Tests configurados (24 tests)
- [x] Cron worker implementado
- [x] Documentación completa
- [x] CRON_SECRET generado: `x83Vj3amE5GX8Vl63S2g+sgMaf2rV2eboAZo3TIwBUI=`

---

## 📍 SIGUIENTE: Crear Repositorio en GitHub

### Opción 1: Con GitHub CLI (Recomendado - Más rápido)

```bash
# Instalar gh CLI si no lo tienes
# Ubuntu/Debian:
sudo apt install gh

# Fedora:
sudo dnf install gh

# Arch:
sudo pacman -S github-cli

# Login
gh auth login
# Elige: GitHub.com → HTTPS → Yes (git credentials) → Login with a browser

# Crear repo y hacer push automáticamente
gh repo create pedidosAI --public --source=. --remote=origin --push

# ¡Listo! Tu código ya está en GitHub
```

### Opción 2: Manual (Si prefieres usar el navegador)

**Paso 1:** Ve a https://github.com/new

**Paso 2:** Completa el formulario:

- Repository name: `pedidosAI`
- Description: `Sistema de gestión de pedidos con IA para restaurantes`
- Visibility: **Public** (gratis)
- **NO** marcar "Add a README file"
- **NO** marcar ".gitignore"
- **NO** seleccionar license (por ahora)
- Click en **Create repository**

**Paso 3:** En tu terminal, ejecuta:

```bash
# Conectar tu repositorio local con GitHub
git remote add origin https://github.com/TU_USUARIO/pedidosAI.git

# Verificar
git remote -v

# Push inicial
git push -u origin main
```

**Paso 4:** Verifica que se subió:

- Ve a `https://github.com/TU_USUARIO/pedidosAI`
- Deberías ver todos los archivos

---

## ☁️ DESPUÉS: Deploy en Vercel

Una vez que tu código esté en GitHub, sigue estos pasos:

### 1. Ve a Vercel

https://vercel.com

### 2. Sign Up / Login

- Click en **Continue with GitHub**
- Autoriza a Vercel

### 3. Importar Proyecto

- Click en **Add New...** → **Project**
- Busca `pedidosAI`
- Click en **Import**

### 4. Configurar (NO CAMBIES NADA, solo agregar variables)

- Framework Preset: **Next.js** ✓ (detectado)
- Root Directory: `./` ✓
- Build Command: automático ✓
- Output Directory: automático ✓

### 5. Variables de Entorno (MUY IMPORTANTE)

Click en **Environment Variables** y agrega:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=      [DÉJALO VACÍO POR AHORA]
CRON_SECRET=x83Vj3amE5GX8Vl63S2g+sgMaf2rV2eboAZo3TIwBUI=
```

⚠️ **Importante:** Necesitas tener estas API keys. Si no las tienes, lee `GUIA_DEPLOYMENT_COMPLETA.md` sección "PASO 1: Obtener API Keys"

### 6. Deploy

- Click en **Deploy**
- Espera 2-3 minutos
- ¡Listo!

### 7. Actualizar APP_URL

1. Copia la URL de tu app: `https://pedidosai-xxx.vercel.app`
2. Settings → Environment Variables
3. Edita `NEXT_PUBLIC_APP_URL` y pega la URL
4. Click **Save**
5. Deployments → Click "..." del último deploy → **Redeploy**

---

## 🤖 FINALMENTE: Configurar GitHub Actions

### 1. GitHub Secrets

En tu repo de GitHub:

- **Settings** → **Secrets and variables** → **Actions**
- Click **New repository secret**

Agrega 2 secrets:

**Secret 1:**

- Name: `APP_URL`
- Value: `https://pedidosai-xxx.vercel.app` (tu URL de Vercel)

**Secret 2:**

- Name: `CRON_SECRET`
- Value: `x83Vj3amE5GX8Vl63S2g+sgMaf2rV2eboAZo3TIwBUI=`

### 2. Probar el Cron Job

- GitHub → **Actions** → **Process Job Queue**
- Click **Run workflow**
- Espera 10 segundos
- Click en el run
- Verifica que diga: `HTTP Status: 200` y `Jobs processed successfully`

---

## ✅ Checklist Final

- [ ] Código en GitHub
- [ ] Deploy en Vercel exitoso (verde)
- [ ] Variables de entorno configuradas en Vercel
- [ ] APP_URL actualizado
- [ ] GitHub Secrets configurados
- [ ] Cron job probado manualmente
- [ ] App funciona en `https://tu-app.vercel.app`

---

## 🆘 ¿Necesitas ayuda?

Lee `docs/GUIA_DEPLOYMENT_COMPLETA.md` para instrucciones detalladas paso a paso.

---

**Tu CRON_SECRET:** `x83Vj3amE5GX8Vl63S2g+sgMaf2rV2eboAZo3TIwBUI=`

⚠️ Guarda este secret, lo necesitarás en:

1. Vercel (variable de entorno)
2. GitHub (secret para Actions)
