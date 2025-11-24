# Propuesta de Mejoras UI: Mobile-First & Design System

**Fecha:** 23 de Noviembre, 2025
**Estado:** Propuesta

## Visión General

El objetivo es transformar la interfaz de PedidosAI en una experiencia **Mobile-First**, visualmente impactante y altamente reutilizable. Actualmente, la UI es funcional pero carece de optimización para móviles y de un sistema de diseño centralizado robusto.

## 1. Auditoría de Componentes & Estrategia de Reutilización

### Análisis de Estado Actual

Hemos detectado que el proyecto utiliza una mezcla de implementaciones:

- **Radix UI Primitives:** `Select`, `Popover`, `Avatar`, `Slot`.
- **Implementaciones Custom:** `Dialog` (usa Context propio, no Radix), `Button` (variants con `cva`).
- **Librerías Externas:** `sonner` (Toasts), `dnd-kit` (Drag & Drop), `lucide-react` (Iconos).

### Estrategia de Componentes

Para lograr una UI escalable, debemos estandarizar el "Core UI Kit" y separarlo de los "Feature Components".

#### A. Core UI Kit (Wrappers de Bajo Nivel)

Debemos crear/refactorizar estos componentes para que sean la base de todo. **No usar librerías externas directamente en las páginas.**

| Componente | Estado Actual  | Acción Recomendada           | Motivo                                                                            |
| :--------- | :------------- | :--------------------------- | :-------------------------------------------------------------------------------- |
| **Dialog** | Custom Context | **Migrar a Radix UI Dialog** | Accesibilidad (a11y), foco trap, y soporte móvil nativo.                          |
| **Select** | Radix UI       | **Mantener y Estilizar**     | Ya usa Radix, pero necesita estilos móviles (Drawer en vez de Dropdown).          |
| **Input**  | Básico         | **Enriquecer**               | Agregar soporte para iconos (start/end adornments) y estados de error integrados. |
| **Button** | `cva` variants | **Expandir**                 | Agregar variantes `loading`, `icon-only` y tamaños móviles (`h-12`).              |
| **Drawer** | _No existe_    | **Crear (Vaul)**             | Crítico para móvil. Reemplaza a Dialogs y Selects en pantallas pequeñas.          |

#### B. Feature Components (Composición)

Componentes complejos que usan el Core Kit. Ejemplo: `OrderReviewBoard` debe romperse en:

- `SupplierCard` (usa `Card`, `Button`, `Badge`)
- `ProductListItem` (usa `Input`, `Button`)

## 2. Arquitectura Frontend & Escalabilidad

### Evaluación de Modernidad

El proyecto usa **Next.js 16 (App Router)** y **Tailwind CSS 4**, lo cual es "State of the Art". Sin embargo, la estructura de carpetas `src/components/ui` vs `src/components/orders` sugiere una separación incipiente pero no estricta.

### Metodología Recomendada: "Domain-Driven UI"

Para escalar sin caos, proponemos organizar los componentes por **Dominio** y **Capas**:

1.  **Atoms/Primitives (`src/components/ui`)**:
    - Botones, Inputs, Cards, Badges.
    - **Regla:** No contienen lógica de negocio. Solo reciben props visuales y callbacks simples.

2.  **Molecules/Patterns (`src/components/patterns`)**:
    - Grupos de átomos con lógica de UI compartida.
    - Ej: `SearchInput` (Input + Icono + Debounce), `ConfirmDialog` (Dialog + Título + Botones).

3.  **Organisms/Features (`src/features/[domain]/components`)**:
    - Componentes específicos del negocio.
    - Ej: `src/features/orders/components/OrderReviewBoard.tsx`.
    - **Regla:** Aquí se inyecta la data y la lógica de negocio (Server Actions, Hooks).

### Patrones de Diseño Recomendados

#### 1. Compound Components

Para componentes complejos como `SupplierSection`, usar el patrón Compound para dar flexibilidad al consumidor:

```tsx
<SupplierCard>
  <SupplierCard.Header icon="🥬">Verduras</SupplierCard.Header>
  <SupplierCard.Content>
    <ProductList items={items} />
  </SupplierCard.Content>
  <SupplierCard.Footer>
    <AddProductButton />
  </SupplierCard.Footer>
</SupplierCard>
```

#### 2. Container/Presentational Pattern (Separación Lógica/Vista)

Separar el `OrderReviewBoard` (Container) de su renderizado.

- `OrderReviewBoard.tsx`: Maneja estado, dnd-kit sensors, llamadas a API.
- `OrderReviewView.tsx`: Recibe `items`, `onDragEnd`, `onSave` y solo renderiza.
  _Beneficio:_ Permite probar la UI con Storybook sin mockear la base de datos.

#### 3. Custom Hooks para Lógica de Negocio

Extraer la lógica de `OrderReviewBoard` a `useOrderReview`:

```tsx
const { items, handleDragEnd, saveChanges } = useOrderReview(initialItems);
```

## 3. Sistema de Diseño & Theme Centralizado

### Propuesta Visual

- **Paleta Semántica:** `--action-primary`, `--surface-secondary`, `--status-success`.
- **Tipografía:** Integrar `Inter` o `Outfit`.
- **Radius & Spacing:** Estandarizar `rounded-xl` para móvil.
- **Animaciones:** Micro-interacciones globales en `tailwind.config.ts`.

## 4. Estrategia Mobile-First (UX)

- **Touch Targets:** Mínimo 44px.
- **Action Sheets:** Reemplazar Modales por Sheets inferiores.
- **Swipe Actions:** Para listas de items.
- **Floating Action Button (FAB):** Para acciones principales.

## Plan de Implementación Actualizado

1.  **Fase 1: Core & Arquitectura**
    - Instalar `vaul` (Drawer).
    - Migrar `Dialog` a Radix UI.
    - Reorganizar carpetas a `src/features`.

2.  **Fase 2: Refactor OrderReview (Container/Presenter)**
    - Crear `useOrderReview`.
    - Dividir `OrderReviewBoard` en sub-componentes atómicos.

3.  **Fase 3: Mobile Polish**
    - Implementar `SwipeableItem`.
    - Aplicar estilos Mobile-First globales.

Esta arquitectura garantiza que el código sea mantenible, testeable y escalable, alineándose con las mejores prácticas modernas de React y Next.js.
