# Plan de Implementación: Autenticación Multi-tenant

## Resumen Ejecutivo

Implementar autenticación Email/Password con modelo multi-tenant (Organizaciones) usando Supabase Auth. El sistema soportará roles (admin/member) e invitaciones por email.

---

## Fase 1: Base de Datos (Complejidad: Alta)

### 1.1 Migración - Tablas Core
- **organizations**: id, name, slug (único), created_by, created_at
- **memberships**: id, user_id, organization_id, role (admin/member), created_at
- **invitations**: id, organization_id, email, role, token, invited_by, expires_at, accepted_at

### 1.2 Migración - Perfil de Usuario
- **profiles**: id (= auth.users.id), full_name, avatar_url, created_at
- Trigger para crear perfil automáticamente al registrar usuario

### 1.3 Políticas RLS (Row Level Security)
- **organizations**: Solo miembros pueden ver/editar su organización
- **memberships**: Admins pueden gestionar membresías
- **invitations**: Admins crean invitaciones, invitados pueden aceptar
- **profiles**: Usuarios ven/editan su propio perfil

### 1.4 Funciones de Base de Datos
- `get_user_organizations()`: Lista organizaciones del usuario actual
- `get_user_role(org_id)`: Retorna rol en organización
- `accept_invitation(token)`: Procesa aceptación de invitación

---

## Fase 2: Configuración Supabase Auth (Complejidad: Media)

### 2.1 Configuración de Auth
- Habilitar proveedor Email/Password
- Configurar URLs de redirección
- Templates de email (confirmación, reset password)

### 2.2 Auth Hooks
- Hook post-signup para crear perfil y primera organización
- Considerar flujo de onboarding

---

## Fase 3: Capa de Aplicación - Backend (Complejidad: Alta)

### 3.1 Utilidades de Auth Server-side
- `src/lib/supabase/server.ts`: Cliente Supabase para Server Components
- `src/lib/supabase/middleware.ts`: Cliente para middleware
- `src/lib/auth/session.ts`: Helpers para sesión actual

### 3.2 Middleware de Protección
- Middleware Next.js para rutas protegidas
- Redirección a login si no autenticado
- Verificación de membresía en organización

### 3.3 Server Actions
- `signIn(email, password)`: Inicio de sesión
- `signUp(email, password, name)`: Registro
- `signOut()`: Cerrar sesión
- `createOrganization(name)`: Crear organización
- `inviteMember(email, role)`: Invitar miembro
- `acceptInvitation(token)`: Aceptar invitación

### 3.4 Contexto de Organización
- Almacenar org_id activa en cookies/URL
- Helper `getCurrentOrganization()`
- Patrón `/app/[org_slug]/...` para rutas

---

## Fase 4: Capa de Aplicación - Frontend (Complejidad: Media)

### 4.1 Páginas de Auth
- `/login`: Formulario de inicio de sesión
- `/register`: Formulario de registro
- `/forgot-password`: Recuperar contraseña
- `/reset-password`: Nueva contraseña

### 4.2 Flujo de Onboarding
- `/onboarding/organization`: Crear primera organización
- `/invite/[token]`: Aceptar invitación

### 4.3 Componentes de UI
- `<AuthForm>`: Formulario reutilizable
- `<UserMenu>`: Menú de usuario (perfil, logout)
- `<OrgSwitcher>`: Selector de organización
- `<RoleGate>`: Mostrar/ocultar por rol

### 4.4 Hooks Cliente
- `useUser()`: Usuario actual
- `useOrganization()`: Organización activa
- `useRole()`: Rol del usuario

---

## Fase 5: Testing y Seguridad (Complejidad: Media)

### 5.1 Tests
- Tests unitarios para Server Actions
- Tests de integración para flujos de auth
- Tests E2E para registro → login → dashboard

### 5.2 Auditoría de Seguridad
- Verificar aislamiento RLS entre organizaciones
- Validar expiración de tokens de invitación
- Revisar protección CSRF en formularios

---

## Orden de Implementación Recomendado

1. **Migraciones DB** (Fase 1.1 → 1.2 → 1.3 → 1.4)
2. **Config Supabase** (Fase 2.1 → 2.2)
3. **Backend Auth** (Fase 3.1 → 3.2 → 3.3 → 3.4)
4. **Frontend Auth** (Fase 4.1 → 4.2 → 4.3 → 4.4)
5. **Testing** (Fase 5.1 → 5.2)

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| RLS mal configurado expone datos | Tests de aislamiento entre orgs |
| Tokens de invitación interceptados | Expiración corta (48h), un solo uso |
| Usuario sin organización | Forzar creación en onboarding |

---

## Archivos Principales a Crear

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (protected)/
│   │   └── [org_slug]/
│   │       └── layout.tsx (verifica membresía)
│   └── onboarding/
│       └── organization/page.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts
│   │   ├── client.ts
│   │   └── middleware.ts
│   └── auth/
│       ├── actions.ts
│       └── session.ts
├── components/
│   └── auth/
│       ├── auth-form.tsx
│       ├── user-menu.tsx
│       └── org-switcher.tsx
└── middleware.ts

supabase/
└── migrations/
    ├── YYYYMMDD_create_profiles.sql
    ├── YYYYMMDD_create_organizations.sql
    ├── YYYYMMDD_create_memberships.sql
    ├── YYYYMMDD_create_invitations.sql
    └── YYYYMMDD_add_rls_policies.sql
```

---

## Lista de Tareas

### Fase 1: Base de Datos

#### 1.1 Tablas Core
- [x] Crear migración para tabla `profiles`
- [x] Crear migración para tabla `organizations`
- [x] Crear migración para tabla `memberships`
- [x] Crear migración para tabla `invitations`
- [x] Crear índices para optimización de queries

#### 1.2 Triggers y Funciones
- [x] Crear trigger para auto-crear perfil en registro
- [x] Crear función `get_user_organizations()`
- [x] Crear función `get_user_role(org_id)`
- [x] Crear función `accept_invitation(token)`
- [x] Crear función para generar slugs únicos

#### 1.3 Políticas RLS
- [x] Habilitar RLS en tabla `profiles`
- [x] Habilitar RLS en tabla `organizations`
- [x] Habilitar RLS en tabla `memberships`
- [x] Habilitar RLS en tabla `invitations`
- [x] Crear políticas SELECT para cada tabla
- [x] Crear políticas INSERT para cada tabla
- [x] Crear políticas UPDATE para cada tabla
- [x] Crear políticas DELETE para cada tabla

### Fase 2: Configuración Supabase

- [x] Configurar proveedor Email/Password en Supabase Dashboard
- [x] Configurar URLs de redirección (site URL, redirect URLs)
- [x] Personalizar template de email de confirmación
- [x] Personalizar template de email de reset password
- [ ] Configurar SMTP personalizado (Resend) - para producción

### Fase 3: Backend - Capa de Aplicación

#### 3.1 Clientes Supabase
- [x] Crear `src/lib/supabase/server.ts` (Server Components)
- [x] Crear `src/lib/supabase/client.ts` (Client Components)
- [x] Crear `src/lib/supabase/middleware.ts` (Middleware)

#### 3.2 Utilidades de Auth
- [x] Crear `src/lib/auth/session.ts` con helpers de sesión
- [x] Implementar `getSession()`
- [x] Implementar `getUser()`
- [x] Implementar `getCurrentOrganization()`

#### 3.3 Middleware
- [x] Crear `src/middleware.ts`
- [x] Implementar protección de rutas autenticadas
- [x] Implementar redirección a login
- [x] Implementar refresh de sesión

#### 3.4 Server Actions
- [x] Crear `src/lib/auth/actions.ts`
- [x] Implementar `signIn(email, password)`
- [x] Implementar `signUp(email, password, fullName)`
- [x] Implementar `signOut()`
- [x] Implementar `resetPassword(email)`
- [x] Implementar `updatePassword(newPassword)`
- [x] Crear `src/lib/organizations/actions.ts`
- [x] Implementar `createOrganization(name)`
- [x] Implementar `inviteMember(email, role)`
- [x] Implementar `acceptInvitation(token)`
- [x] Implementar `removeMember(userId)`
- [x] Implementar `updateMemberRole(userId, role)`

### Fase 4: Frontend - Capa de Aplicación

#### 4.1 Páginas de Auth
- [x] Crear `src/app/(auth)/layout.tsx`
- [x] Crear `src/app/(auth)/login/page.tsx`
- [x] Crear `src/app/(auth)/register/page.tsx`
- [x] Crear `src/app/(auth)/forgot-password/page.tsx`
- [x] Crear `src/app/(auth)/reset-password/page.tsx`
- [x] Crear `src/app/(auth)/verify-email/page.tsx`

#### 4.2 Flujo de Onboarding
- [x] Crear `src/app/onboarding/layout.tsx`
- [x] Crear `src/app/onboarding/organization/page.tsx`
- [x] Crear `src/app/invite/[token]/page.tsx`

#### 4.3 Layout Protegido
- [x] Crear `src/app/(protected)/layout.tsx`
- [x] Crear `src/app/(protected)/[org_slug]/layout.tsx`
- [x] Implementar verificación de membresía en layout

#### 4.4 Componentes de Auth
- [x] Crear `src/components/auth/login-form.tsx`
- [x] Crear `src/components/auth/register-form.tsx`
- [x] Crear `src/components/auth/forgot-password-form.tsx`
- [x] Crear `src/components/auth/reset-password-form.tsx`
- [x] Crear `src/components/auth/accept-invitation-form.tsx`
- [x] Crear `src/components/auth/onboarding-form.tsx`
- [x] Crear `src/components/auth/user-menu.tsx`
- [x] Crear `src/components/auth/org-switcher.tsx`
- [x] Crear `src/components/auth/role-gate.tsx`

#### 4.5 Hooks Cliente
- [x] Crear `src/hooks/use-user.ts`
- [x] Crear `src/hooks/use-organization.ts`
- [x] Crear `src/hooks/use-role.ts`

### Fase 5: Testing y Seguridad

#### 5.1 Tests Unitarios
- [ ] Tests para Server Actions de auth
- [ ] Tests para Server Actions de organizations
- [ ] Tests para funciones de base de datos
- [ ] Tests para helpers de sesión

#### 5.2 Tests de Integración
- [ ] Test flujo completo de registro
- [ ] Test flujo completo de login
- [ ] Test flujo de reset password
- [ ] Test flujo de invitación
- [ ] Test cambio de organización

#### 5.3 Tests E2E
- [ ] E2E: Registro → Onboarding → Dashboard
- [ ] E2E: Login → Dashboard
- [ ] E2E: Invitación → Aceptación → Dashboard

#### 5.4 Auditoría de Seguridad
- [ ] Verificar aislamiento RLS entre organizaciones
- [ ] Test de acceso cruzado entre organizaciones
- [ ] Validar expiración de tokens de invitación
- [ ] Verificar tokens de un solo uso
- [ ] Revisar protección CSRF en formularios
- [ ] Verificar sanitización de inputs
- [ ] Revisar manejo seguro de sesiones

---

## Notas de Implementación

### Convenciones de Nombres
- Migraciones: `YYYYMMDDHHMMSS_descripcion_snake_case.sql`
- Server Actions: verbos en inglés (`signIn`, `createOrganization`)
- Hooks: prefijo `use` (`useUser`, `useOrganization`)
- Componentes: PascalCase (`AuthForm`, `UserMenu`)

### Patrones a Seguir
- Consultar `pat-supabase` para patrones de Supabase
- Consultar `pat-react` para patrones de React/Next.js
- Consultar `qual-security` para estándares de seguridad
- Consultar `arch-adr-007` para decisiones arquitectónicas

### Dependencias Externas
- `@supabase/ssr` - Cliente Supabase para SSR
- `@supabase/supabase-js` - Cliente Supabase base
- Verificar versiones compatibles con Next.js 16

---

## Progreso

**Última actualización**: 2025-11-19

- **Fase 1**: 21/21 tareas completadas ✅
- **Fase 2**: 4/5 tareas completadas (SMTP para producción pendiente)
- **Fase 3**: 18/18 tareas completadas ✅
- **Fase 4**: 23/23 tareas completadas ✅
- **Fase 5**: 0/17 tareas completadas

**Total**: 66/84 tareas completadas (79%)

### Archivos Creados

#### Migraciones
- `supabase/migrations/20251119000001_create_profiles.sql`
- `supabase/migrations/20251119000002_add_invitation_token_and_functions.sql`

#### Backend
- `src/lib/supabase/middleware.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/actions.ts`
- `src/lib/organizations/actions.ts`
- `src/middleware.ts`

#### Frontend - Páginas
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/(auth)/verify-email/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/invite/[token]/page.tsx`
- `src/app/(protected)/layout.tsx`
- `src/app/(protected)/[slug]/layout.tsx`
- `src/app/(protected)/[slug]/page.tsx`

#### Frontend - Componentes
- `src/components/auth/login-form.tsx`
- `src/components/auth/register-form.tsx`
- `src/components/auth/forgot-password-form.tsx`
- `src/components/auth/reset-password-form.tsx`
- `src/components/auth/accept-invitation-form.tsx`
- `src/components/auth/onboarding-form.tsx`
- `src/components/auth/user-menu.tsx`
- `src/components/auth/org-switcher.tsx`
- `src/components/auth/role-gate.tsx`

#### Frontend - Hooks
- `src/hooks/use-user.ts`
- `src/hooks/use-organization.ts`
- `src/hooks/use-role.ts`

### Próximos Pasos
1. **Testing (Fase 5)** - Próxima prioridad
   - Tests unitarios para Server Actions
   - Tests de integración para flujos de auth
   - Tests E2E (registro → login → dashboard)
   - Auditoría de seguridad RLS
2. **Para producción**
   - Configurar SMTP con Resend
   - Verificar dominio en Resend
   - Actualizar NEXT_PUBLIC_SITE_URL con dominio de producción
