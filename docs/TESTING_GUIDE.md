# Guía de Testing - pedidosAI

## 📋 Resumen

El proyecto utiliza dos frameworks de testing:

- **Vitest**: Tests unitarios e integración
- **Playwright**: Tests end-to-end (E2E)

---

## 🧪 Tests Unitarios con Vitest

### Ejecutar tests

```bash
# Ejecutar todos los tests
pnpm test

# Ejecutar tests en modo watch (auto-reload)
pnpm test --watch

# Ejecutar tests con cobertura
pnpm test:coverage

# Ejecutar tests específicos
pnpm test gemini
pnpm test queue
```

### Estructura de tests

```
src/
├── lib/
│   └── ai/
│       ├── gemini.ts
│       └── gemini.test.ts         # Tests del parser de IA
├── services/
│   ├── queue.ts
│   └── queue.test.ts              # Tests del job queue
└── test/
    └── setup.ts                   # Configuración global
```

### Escribir tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('MiModulo', () => {
  beforeEach(() => {
    // Setup antes de cada test
    vi.clearAllMocks();
  });

  it('should do something', () => {
    const result = miFunction();
    expect(result).toBe(expected);
  });

  it('should handle errors', async () => {
    await expect(asyncFunction()).rejects.toThrow('Error message');
  });
});
```

### Mocking

#### Mock de módulos externos

```typescript
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel = vi.fn();
    },
  };
});
```

#### Mock de Supabase

```typescript
const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
} as unknown as SupabaseClient;
```

---

## 🎭 Tests E2E con Playwright

### Ejecutar tests E2E

```bash
# Ejecutar todos los tests E2E
pnpm test:e2e

# Ejecutar con UI interactiva
pnpm test:e2e:ui

# Ejecutar en modo debug
pnpm test:e2e --debug

# Ejecutar en un navegador específico
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
```

### Estructura de tests E2E

```
tests/
└── e2e/
    ├── auth.spec.ts           # Tests de autenticación
    ├── orders.spec.ts         # Tests de flujo de órdenes
    └── suppliers.spec.ts      # Tests de gestión de proveedores
```

### Escribir tests E2E

```typescript
import { test, expect } from '@playwright/test';

test.describe('Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
  });

  test('should create a new order', async ({ page }) => {
    await page.goto('/orders/new');
    await page.fill('textarea', 'necesito 2 kilos de tomate');
    await page.click('button:text("Procesar")');

    await expect(page.locator('.order-item')).toContainText('Tomate');
  });
});
```

---

## 📊 Cobertura de Tests

### Objetivos de cobertura

```json
{
  "statements": 80,
  "branches": 75,
  "functions": 80,
  "lines": 80
}
```

### Ver reporte de cobertura

```bash
pnpm test:coverage

# Abrir reporte HTML
open coverage/index.html  # Mac
xdg-open coverage/index.html  # Linux
```

### Módulos críticos con tests

✅ **src/lib/ai/gemini.ts**

- Validación de schemas con Zod
- Parsing de órdenes
- Retry logic
- Manejo de suppliers

✅ **src/services/queue.ts**

- Enqueue de jobs
- Procesamiento de batch
- Manejo de errores
- Retry con max attempts

---

## 🧩 Tests Existentes

### gemini.test.ts (15 tests)

**ParsedItemSchema validation:**

- ✓ Valida item correcto
- ✓ Rechaza unit inválida
- ✓ Rechaza confidence fuera de rango
- ✓ Acepta supplier_id null

**ParseResultSchema validation:**

- ✓ Valida array de items
- ✓ Rechaza items inválidos

**parseOrderText():**

- ✓ Parsea texto simple
- ✓ Maneja contexto de suppliers
- ✓ Retry en caso de fallo
- ✓ Throw después de max retries
- ✓ Maneja respuesta vacía
- ✓ Maneja múltiples items
- ✓ Parsea diferentes unidades

### queue.test.ts (9 tests)

**enqueue():**

- ✓ Encola job exitosamente
- ✓ Throw en caso de error
- ✓ Permite user_id undefined para system jobs

**processBatch():**

- ✓ Procesa jobs pendientes
- ✓ Maneja queue vacía
- ✓ Marca job como fallido en error
- ✓ Respeta límite de max attempts
- ✓ Throw en tipo de job desconocido

**processPending():**

- ✓ Llama a processBatch

---

## 🚀 Mejores Prácticas

### 1. AAA Pattern (Arrange-Act-Assert)

```typescript
it('should parse order text', async () => {
  // Arrange
  const text = 'necesito 2 kilos de tomate';

  // Act
  const result = await parseOrderText(text);

  // Assert
  expect(result).toHaveLength(1);
  expect(result[0].product).toBe('Tomate');
});
```

### 2. Tests descriptivos

```typescript
// ❌ Malo
it('works', () => { ... });

// ✅ Bueno
it('should parse quantity with decimals correctly', () => { ... });
```

### 3. Un assert por concepto

```typescript
// ❌ Malo
it('should validate item', () => {
  expect(item.product).toBe('Tomate');
  expect(item.quantity).toBe(2);
  expect(item.unit).toBe('kg');
  expect(item.price).toBe(100);
  expect(item.supplier).toBe('Supplier1');
});

// ✅ Bueno
it('should parse product name correctly', () => {
  expect(item.product).toBe('Tomate');
});

it('should parse quantity correctly', () => {
  expect(item.quantity).toBe(2);
});
```

### 4. Evitar mocks innecesarios

```typescript
// ❌ Solo mockea lo necesario
vi.mock('entire-library');

// ✅ Mock específico
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: mockClass,
}));
```

### 5. Cleanup después de tests

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

---

## 🎯 Próximos Tests a Agregar

### Prioridad Alta

- [ ] `src/services/orders.ts` - OrderService.createSupplierOrders()
- [ ] `src/services/notifications.ts` - NotificationService.sendSupplierOrder()
- [ ] `src/lib/ai/groq.ts` - transcribeAudio()
- [ ] `src/lib/ai/classifier.ts` - classifyItems()

### Prioridad Media

- [ ] `src/lib/auth/actions.ts` - signIn, signUp
- [ ] `src/lib/organizations/actions.ts` - createOrganization
- [ ] `src/app/(protected)/orders/actions.ts` - Server Actions

### Tests E2E

- [ ] Flujo completo: Register → Create Org → Create Order → Send
- [ ] Audio recording → transcription → parsing
- [ ] Invitations flow
- [ ] Supplier management

---

## 🐛 Debugging Tests

### Vitest debugging

```bash
# Modo debug con inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs

# Con breakpoints en VSCode
# Agregar a .vscode/launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test", "--run"],
  "console": "integratedTerminal"
}
```

### Playwright debugging

```bash
# Modo debug con Playwright Inspector
pnpm test:e2e --debug

# Con headed browser
pnpm test:e2e --headed

# Slow motion
pnpm test:e2e --headed --slow-mo=1000
```

### Ver logs detallados

```typescript
// En tests de Vitest
console.log('Debug info:', variable);

// En tests de Playwright
await page.screenshot({ path: 'debug.png' });
console.log(await page.content());
```

---

## 📚 Referencias

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)

---

**Última actualización:** 23 de Noviembre, 2025
