# Propuesta de Mejoras Arquitectónicas Adicionales

**Fecha:** 23 de Noviembre, 2025
**Estado:** Propuesta

## Introducción

Tras analizar el código base más allá de las prioridades iniciales del chat, hemos identificado varias áreas donde se pueden aplicar los principios de separación de responsabilidades, escalabilidad y optimización para fortalecer aún más el proyecto.

## Áreas de Mejora Identificadas

### 1. Desacoplamiento de Lógica AI (`src/lib/ai/gemini.ts`)

**Problema:**
La lógica de interacción con Gemini, incluyendo el prompt del sistema y el esquema de validación (Zod), está hardcodeada dentro de la función `parseOrderText`.

- **Rigidez:** Cambiar el prompt requiere tocar el código de infraestructura.
- **Duplicación de Tipos:** Los enums en `ParsedItemSchema` (unidades, categorías) duplican los valores de la base de datos, creando riesgo de desincronización.

**Propuesta:**

- **Extraer Prompts:** Mover los prompts a archivos de texto o constantes separadas (`src/lib/ai/prompts.ts`).
- **Sincronizar Tipos:** Generar el esquema Zod dinámicamente o basarlo en los tipos generados por Supabase para asegurar consistencia con la DB.
- **Interface Genérica:** Crear una interfaz `IOrderParser` para permitir cambiar de proveedor de AI (ej: Claude, GPT-4) sin cambiar el código cliente.

### 2. Refactorización de Componentes UI Monolíticos (`OrderReviewBoard`)

**Problema:**
`OrderReviewBoard.tsx` es un componente cliente grande (>350 líneas) que maneja múltiples responsabilidades:

- Estado local de items y proveedores.
- Lógica de Drag & Drop (`dnd-kit`).
- Diálogos de confirmación.
- Llamadas a Server Actions.

**Propuesta:**

- **Composición:** Dividir en sub-componentes más pequeños:
  - `ReviewHeader`: Botones de acción y navegación.
  - `ReviewDialogs`: Manejo de confirmaciones.
  - `DraggableItem`: Lógica específica del item arrastrable.
- **Custom Hook:** Extraer la lógica de estado y manejadores a un hook `useOrderReviewState`.

### 3. Inyección de Dependencias en Servicios (`OrderService`)

**Problema:**
Aunque `OrderService` permite pasar un `SupabaseClient`, en algunos casos se instancia internamente `createClient()`. Esto dificulta el testing unitario puro ya que acopla el servicio a la implementación concreta de Supabase y a las cookies del navegador/servidor.

**Propuesta:**

- **Inyección Obligatoria:** Hacer que el `SupabaseClient` sea un argumento obligatorio en el constructor o métodos de los servicios.
- **Factory Pattern:** Usar factories o un contenedor de dependencias simple para instanciar los servicios con el cliente adecuado según el contexto (Server Component vs Server Action vs Route Handler).

### 4. Estrategia de Manejo de Errores Centralizada

**Problema:**
El manejo de errores es inconsistente. A veces se usa `console.error`, otras `toast.error`, y otras se lanzan excepciones. No hay un mecanismo claro para reportar errores críticos al servidor o un servicio de monitoreo (como Sentry).

**Propuesta:**

- **Error Boundary:** Implementar un Error Boundary global en React para capturar fallos de renderizado.
- **Utility de Logging:** Crear un `Logger` service que abstraiga `console.log` y permita conectar servicios externos en el futuro.
- **Toast Unificado:** Crear un hook o utilidad para mostrar notificaciones de error estandarizadas (ej: "Error [CODIGO]: Mensaje amigable").

### 5. Optimización de Consultas (N+1 Problem)

**Problema Potencial:**
En `OrderReviewPage`, se obtienen items y proveedores. Si la lógica de obtención de datos crece, podríamos caer en problemas de N+1 queries si no usamos `join` o `select` con relaciones adecuadamente.

**Propuesta:**

- **Query Objects:** Centralizar las consultas complejas en "Query Objects" o funciones reutilizables en la capa de infraestructura, asegurando que siempre se traigan las relaciones necesarias en una sola petición.

## Plan de Acción Recomendado

1.  **Refactorizar `OrderReviewBoard`** (Alta prioridad, mejora mantenibilidad inmediata).
2.  **Extraer Prompts y Tipos de AI** (Media prioridad, reduce deuda técnica).
3.  **Estandarizar Inyección de Dependencias** (Baja prioridad, mejora testability a largo plazo).

Estas mejoras seguirán consolidando a PedidosAI como una aplicación robusta, mantenible y preparada para escalar.
