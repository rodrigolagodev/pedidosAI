# PWA (Progressive Web App) - Supplai

## ¿Qué es una PWA?

Una Progressive Web App (PWA) es una aplicación web que utiliza las capacidades modernas de los navegadores para ofrecer una experiencia similar a una aplicación nativa. Supplai ahora puede instalarse en dispositivos móviles y de escritorio, funcionar offline, y recibir notificaciones push.

## Características Implementadas

### ✅ Instalabilidad

- **Android**: Se puede instalar directamente desde Chrome
- **iOS**: Se puede agregar a la pantalla de inicio desde Safari
- **Desktop**: Chrome, Edge y otros navegadores Chromium permiten instalación

### ✅ Funcionalidad Offline

- **Chat**: Ya implementado con IndexedDB (Dexie), funciona completamente offline
- **Assets estáticos**: Imágenes, CSS, JS cacheados automáticamente
- **Páginas visitadas**: Disponibles offline después de la primera visita
- **Página offline**: Mensaje amigable cuando no hay conexión

### ✅ Rendimiento Mejorado

- **Service Worker**: Cachea recursos para carga instantánea
- **Imágenes optimizadas**: StaleWhileRevalidate para mejor UX
- **API calls**: NetworkFirst con fallback a caché

### ✅ Apariencia Nativa

- **Modo standalone**: Sin barra de navegador del browser
- **Splash screen**: Pantalla de carga personalizada (iOS)
- **Iconos**: Diseño consistente en todos los dispositivos

## Cómo Instalar

### 📱 Android (Chrome/Edge)

1. Abre **Supplai** en Chrome móvil
2. Verás un banner en la parte inferior: **"Agregar Supplai a pantalla de inicio"**
3. Toca **"Agregar"** o **"Instalar"**
4. El ícono aparecerá en tu pantalla de inicio
5. Abre la app y disfruta del modo standalone

**Método alternativo:**

1. Toca el menú (⋮) en Chrome
2. Selecciona **"Agregar a pantalla de inicio"** o **"Instalar aplicación"**
3. Confirma

### 📱 iOS (Safari)

> ⚠️ iOS tiene algunas limitaciones con PWAs (ver sección de Limitaciones)

1. Abre **Supplai** en Safari móvil
2. Toca el botón **"Compartir"** (cuadro con flecha hacia arriba)
3. Desplázate y selecciona **"Agregar a inicio"**
4. Personaliza el nombre si deseas
5. Toca **"Agregar"**
6. El ícono aparecerá en tu pantalla de inicio

### 💻 Desktop (Chrome/Edge)

1. Abre **Supplai** en Chrome o Edge
2. Busca el ícono de instalación en la barra de direcciones (⊕)
3. Haz clic en **"Instalar"**
4. La app se abrirá en una ventana independiente
5. Puedes fijarla en la barra de tareas

## Limitaciones de iOS

Apple Safari tiene ciertas restricciones con PWAs:

- ❌ **Sin notificaciones push** (no soportado por Safari)
- ⚠️ **Caché limitado**: Safari puede borrar el caché después de 7 días sin uso
- ⚠️ **Sin background sync**: La sincronización solo ocurre cuando la app está abierta
- ⚠️ **Service worker limitado**: Algunas funcionalidades avanzadas no disponibles

**A pesar de esto**, el chat sigue funcionando offline gracias a **IndexedDB** que sí está soportado por Safari.

## Desarrollo Local

### Modo Desarrollo

Por defecto, el **Service Worker está deshabilitado en desarrollo** para facilitar el debugging.

```bash
pnpm dev
# La app funciona normalmente, pero sin Service Worker
```

### Probar PWA en Desarrollo

Si necesitas probar la funcionalidad PWA localmente:

```bash
# Build con webpack (requerido para PWA)
pnpm build --webpack

# Iniciar servidor de producción
pnpm start
```

Luego abre `http://localhost:3000` y verifica:

- Service Worker se registra correctamente
- Manifest está disponible en `/manifest.webmanifest`
- Archivos PWA generados en `/public`: `sw.js`, `workbox-*.js`

### Inspeccionar PWA

**Chrome DevTools** (F12):

1. Ve a la pestaña **"Application"**
2. Explora:
   - **Manifest**: Verifica configuración y iconos
   - **Service Workers**: Estado, actualización, unregister
   - **Cache Storage**: Inspecciona qué está cacheado
   - **IndexedDB > PedidosDB**: Revisa datos offline del chat

## Deployment

### Vercel (Recomendado)

El proyecto está configurado para deployarse automáticamente en Vercel. **IMPORTANTE**:

```bash
# En Vercel, asegúrate de configurar el build command:
Build Command: pnpm build --webpack

# El --webpack es CRÍTICO porque Next.js 16 usa Turbopack por defecto
# pero next-pwa solo funciona con webpack
```

### Variables de Entorno

Asegúrate de configurar en Vercel:

```
NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app
```

Esta variable es esencial para:

- Email confirmation links
- OAuth redirects
- **PWA start_url** y scope

### Verificación Post-Deploy

1. **Lighthouse Audit**:
   - Abre Chrome DevTools > Lighthouse
   - Ejecuta audit solo de **PWA**
   - Verifica score >= 90

2. **Instalabilidad**:
   - Prueba instalar desde un dispositivo real
   - Verifica que el ícono es correcto
   - Confirma modo standalone

3. **Offline**:
   - Instala la app
   - Desconecta WiFi
   - Navega por páginas ya visitadas
   - Verifica que el chat sigue funcionando

## Actualización de Iconos

Actualmente se usa un **icono placeholder**. Para actualizarlo:

### 1. Preparar Icono Final

- **Formato**: PNG con fondo
- **Tamaño**: 512x512 px mínimo (1024x1024 recomendado)
- **Diseño**: Debe verse bien en círculo (Android aplica máscaras)
- **Safe zone**: Mantén contenido importante en el centro 80%

### 2. Generar Tamaños

Reemplaza los archivos en `/public/icons/`:

```bash
# Con ImageMagick
convert tu-icon-original.png -resize 192x192 public/icons/icon-192x192.png
convert tu-icon-original.png -resize 512x512 public/icons/icon-512x512.png
cp public/icons/icon-192x192.png public/icons/apple-touch-icon.png
```

### 3. Maskable Icons (opcional pero recomendado)

Para mejor soporte en Android 13+:

- Usa [Maskable.app](https://maskable.app/) para probar/generar
- Guarda versiones maskable en `/public/icons/icon-maskable-*.png`
- Actualiza `src/app/manifest.ts`:

```typescript
{
  src: '/icons/icon-maskable-512x512.png',
  sizes: '512x512',
  type: 'image/png',
  purpose: 'maskable',
}
```

### 4. Rebuild y Deploy

```bash
pnpm build --webpack
# Deploy a Vercel
```

Los usuarios existentes recibirán el nuevo ícono en la próxima actualización del Service Worker.

## Troubleshooting

### "La app no se puede instalar"

- ✅ Verifica que estás en **HTTPS** (Vercel lo maneja automáticamente)
- ✅ Confirma que `/manifest.webmanifest` es accesible
- ✅ Revisa que los iconos existen en `/public/icons/`
- ✅ En iOS, asegúrate de usar **Safari** (no Chrome iOS)

### "El Service Worker no se registra"

- ✅ Revisa la consola en DevTools
- ✅ Verifica que hiciste build con `--webpack`
- ✅ Confirma que `sw.js` existe en `/public`
- ✅ Verifica que no estás en modo desarrollo

### "Los cambios no se reflejan"

El Service Worker cachea agresivamente. Para forzar actualización:

1. **Chrome DevTools** > Application > Service Workers
2. Click en **"Unregister"**
3. Hard refresh: `Ctrl+Shift+R` (Windows) o `Cmd+Shift+R` (Mac)

Alternativamente:

- Activa **"Update on reload"** en DevTools
- Usa modo incognito para testing

### "Datos desactualizados"

- Las peticiones a **Supabase** usan `NetworkOnly` (no caché)
- IndexedDB se sincroniza cuando hay conexión
- Fuerza sync manual: El `SyncContext` detecta cuando vuelve la conexión

## Arquitectura Técnica

### Caching Strategies

| Recurso         | Estrategia           | Duración  |
| --------------- | -------------------- | --------- |
| Google Fonts    | CacheFirst           | 1 año     |
| Fuentes locales | StaleWhileRevalidate | 7 días    |
| Imágenes        | StaleWhileRevalidate | 24 horas  |
| JS/CSS          | StaleWhileRevalidate | 24 horas  |
| Next.js data    | StaleWhileRevalidate | 24 horas  |
| API Routes      | NetworkFirst         | 24 horas  |
| **Supabase**    | **NetworkOnly**      | Sin caché |
| Otros           | NetworkFirst         | 24 horas  |

### IndexedDB (Ya existente)

PedidosAI usa **Dexie** para almacenamiento offline:

- **orders**: Pedidos en draft
- **messages**: Conversaciones del chat (con audio blobs)
- **orderItems**: Items clasificados por proveedor

**Sync automática** cuando se detecta conexión (`SyncContext`).

### Estructura de Archivos

```
/public
  /icons/
    icon-192x192.png       # Icono Android
    icon-512x512.png       # Icono alta res
    apple-touch-icon.png   # Icono iOS
  offline.html             # Página fallback
  sw.js                    # Service Worker (generado)
  workbox-*.js             # Workbox (generado)

/src/app
  manifest.ts              # Web App Manifest config
  layout.tsx               # Meta tags PWA

next.config.ts             # Configuración PWA
```

## Referencias

- [Next PWA Docs](https://github.com/DuCanhGH/next-pwa)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
