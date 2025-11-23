# Sistema de Audio Refactorizado

## Resumen

Se ha refactorizado completamente el sistema de audio/transcripción para resolver el problema de duplicación de solicitudes que causaba errores de rate limit en Groq (12738 segundos solicitados desde un solo audio).

## Problema Identificado

### Arquitectura Anterior

- `VoiceRecorderButton` usaba `useAudioRecorder` (solo grabación)
- `useEffect` dependía de `onRecordingComplete` callback
- El callback era recreado en cada render del componente padre
- Esto causaba múltiples ejecuciones del `useEffect` con el mismo blob
- Resultado: **Múltiples uploads del mismo audio → Rate limit de Groq**

### Error Original

```
Request too large: audio_duration exceeds 7200.0 seconds.
Requested: 12738 seconds
Limit: 7200 seconds
```

De solo **1 audio procesado**, se estaban acumulando ~12738 segundos (3.5 horas).

## Solución Implementada

### Arquitectura Nueva - State Machine Pattern

Se implementó un **patrón de máquina de estados** con las siguientes mejoras:

#### 1. **Nuevos Types** (`src/types/audio.ts`)

```typescript
export type AudioState =
  | { status: 'idle' }
  | { status: 'recording'; startTime: number; duration: number }
  | { status: 'recorded'; blob: Blob; duration: number; size: number }
  | { status: 'validating'; blob: Blob }
  | { status: 'uploading'; blob: Blob; progress: number }
  | { status: 'transcribing'; audioFileId: string }
  | { status: 'success'; transcription: string; audioFileId: string; duration: number }
  | { status: 'error'; error: AudioError; blob?: Blob; retryable: boolean };
```

**Estados claramente definidos:**

- `idle` → `recording` → `recorded` → `validating` → `uploading` → `transcribing` → `success` | `error`

#### 2. **Hook Unificado** (`src/hooks/useAudioTranscription.ts`)

Combina grabación, validación, upload y transcripción en un solo hook:

```typescript
export function useAudioTranscription(options: UseAudioTranscriptionOptions = {}) {
  const { orderId, onSuccess, onError } = options;

  return {
    state, // AudioState actual
    startRecording, // Iniciar grabación
    stopRecording, // Detener grabación
    retry, // Reintentar después de error
    reset, // Resetear a idle
    isRecording, // Helper booleano
    isProcessing, // Helper booleano
    canRetry, // Helper booleano
  };
}
```

**Características clave:**

##### a) **Validación Robusta**

```typescript
function validateBlob(blob: Blob, duration: number): AudioError | null {
  // Validar tamaño (MAX 25MB)
  if (blob.size > MAX_AUDIO_SIZE) {
    return { type: 'size_exceeded', maxSize, actualSize };
  }

  // Validar duración (MAX 5 minutos)
  if (duration > MAX_RECORDING_DURATION) {
    return { type: 'duration_exceeded', maxDuration, actualDuration };
  }

  return null;
}
```

##### b) **Idempotencia con Hash SHA-256**

```typescript
async function hashBlob(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// En uploadAndTranscribe:
const blobHash = await hashBlob(blob);
const alreadyProcessed = processedRecordingsRef.current.find(r => r.blobHash === blobHash);

if (alreadyProcessed && alreadyProcessed.transcription) {
  // Retornar resultado cached, NO re-upload
  setState({ status: 'success', transcription: alreadyProcessed.transcription });
  return;
}
```

##### c) **Rate Limiting Client-Side**

```typescript
function checkRateLimit(processedRecordings: ProcessedRecording[]): AudioError | null {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentRecordings = processedRecordings.filter(r => r.timestamp > oneHourAgo);

  if (recentRecordings.length >= MAX_RECORDINGS_PER_HOUR) {
    const resetAt = new Date(oldestRecording.timestamp + 60 * 60 * 1000);
    return {
      type: 'rate_limit',
      resetAt,
      message: `Has alcanzado el límite de ${MAX_RECORDINGS_PER_HOUR} grabaciones por hora.`,
    };
  }

  return null;
}
```

**Límites:**

- **MAX_RECORDING_DURATION**: 5 minutos (300 segundos)
- **MAX_AUDIO_SIZE**: 25 MB (límite de Groq)
- **MAX_RECORDINGS_PER_HOUR**: 10 grabaciones

##### d) **Manejo de Errores Tipado**

```typescript
export type AudioError =
  | { type: 'microphone_permission'; message: string }
  | { type: 'recording_failed'; message: string }
  | { type: 'duration_exceeded'; maxDuration: number; actualDuration: number }
  | { type: 'size_exceeded'; maxSize: number; actualSize: number }
  | { type: 'rate_limit'; resetAt: Date; message: string }
  | { type: 'upload_failed'; message: string; retryCount: number }
  | { type: 'transcription_failed'; message: string; retryCount: number }
  | { type: 'validation_failed'; message: string }
  | { type: 'unknown'; message: string };
```

#### 3. **VoiceRecorderButton Refactorizado** (`src/components/orders/VoiceRecorderButton.tsx`)

**Cambios principales:**

- ❌ Eliminado `useEffect` problemático
- ✅ Usa `useAudioTranscription` directamente
- ✅ Muestra estados de progreso (validando, subiendo, transcribiendo)
- ✅ Muestra errores específicos con retry button
- ✅ Auto-stop a los 5 minutos

**Nueva interfaz:**

```typescript
interface VoiceRecorderButtonProps {
  orderId?: string;
  onTranscriptionSuccess: (result: TranscriptionResult) => void;
  disabled?: boolean;
}
```

**Mejoras UI:**

- Muestra tiempo de grabación en tiempo real
- Indica estado actual: "Validando...", "Subiendo...", "Transcribiendo..."
- Error display con mensajes claros
- Botón de retry para errores recuperables
- Indicador visual de error (icono AlertCircle)

#### 4. **OrderChatContext Actualizado** (`src/context/OrderChatContext.tsx`)

**Nuevo método simplificado:**

```typescript
const processTranscription = useCallback(
  async (result: { transcription: string; audioFileId: string }) => {
    // La transcripción ya está hecha, solo agregar mensaje
    await addMessage('user', result.transcription, result.audioFileId);
  },
  [addMessage]
);
```

**Comparación:**

- **Antes**: `processAudio(blob: Blob)` → hacía upload y transcripción
- **Ahora**: `processTranscription(result)` → solo agrega mensaje (transcripción ya hecha en el hook)

## Beneficios

### 1. **Idempotencia Garantizada**

- ✅ No más duplicados del mismo audio
- ✅ Cache basado en SHA-256 hash del blob
- ✅ Histórico de grabaciones procesadas (se limpian después de 1 hora)

### 2. **Rate Limiting Proactivo**

- ✅ Límite de 10 grabaciones por hora (client-side)
- ✅ Mensajes claros cuando se alcanza el límite
- ✅ Muestra cuándo se podrá grabar nuevamente

### 3. **Validación Temprana**

- ✅ Validar tamaño antes de upload (25MB max)
- ✅ Validar duración antes de upload (5 min max)
- ✅ Auto-stop al límite de duración
- ✅ Mensajes de error específicos

### 4. **Manejo de Errores Robusto**

- ✅ Errores tipados con discriminated unions
- ✅ Retry automático para errores recuperables
- ✅ Mensajes específicos por tipo de error
- ✅ UI/UX clara para el usuario

### 5. **State Machine Predecible**

- ✅ Estados mutuamente exclusivos
- ✅ Transiciones claras entre estados
- ✅ Fácil debugging (solo verificar state.status)
- ✅ Mejor testabilidad

## Testing

Se agregó suite de tests en `src/hooks/useAudioTranscription.test.tsx`:

```typescript
describe('useAudioTranscription', () => {
  describe('Recording', () => {
    /* ... */
  });
  describe('Validation', () => {
    /* ... */
  });
  describe('Upload and Transcription', () => {
    /* ... */
  });
  describe('Idempotency', () => {
    /* ... */
  });
  describe('Retry', () => {
    /* ... */
  });
  describe('Reset', () => {
    /* ... */
  });
});
```

**Cobertura:**

- ✅ Iniciar/detener grabación
- ✅ Manejo de errores de permisos
- ✅ Validación de tamaño y duración
- ✅ Upload y transcripción exitosos
- ✅ Manejo de errores de API (rate limit, upload failed, etc.)
- ✅ Idempotencia (no re-upload de mismo blob)
- ✅ Retry después de error
- ✅ Reset a estado idle

## Migración

### Antes

```typescript
// VoiceRecorderButton.tsx
const { audioBlob } = useAudioRecorder();

useEffect(() => {
  if (audioBlob) {
    onRecordingComplete(audioBlob); // ❌ Problemático
  }
}, [audioBlob, onRecordingComplete]);

// ChatInput.tsx
<VoiceRecorderButton
  onRecordingComplete={processAudio}
  isProcessing={isProcessing}
/>

// OrderChatContext.tsx
const processAudio = async (blob: Blob) => {
  // Upload y transcripción aquí
};
```

### Después

```typescript
// VoiceRecorderButton.tsx
const { state, startRecording, stopRecording } = useAudioTranscription({
  orderId,
  onSuccess: onTranscriptionSuccess,
  onError: (error) => console.error(error),
});

// ✅ No useEffect - todo manejado internamente

// ChatInput.tsx
<VoiceRecorderButton
  orderId={orderId || undefined}
  onTranscriptionSuccess={processTranscription}
  disabled={input.length > 0}
/>

// OrderChatContext.tsx
const processTranscription = async (result) => {
  await addMessage('user', result.transcription, result.audioFileId);
};
```

## Archivos Modificados

### Nuevos

- ✅ `src/types/audio.ts` - Types de la máquina de estados
- ✅ `src/hooks/useAudioTranscription.ts` - Hook unificado
- ✅ `src/hooks/useAudioTranscription.test.tsx` - Tests

### Modificados

- ✅ `src/components/orders/VoiceRecorderButton.tsx` - Refactorizado
- ✅ `src/components/orders/ChatInput.tsx` - Actualizado props
- ✅ `src/context/OrderChatContext.tsx` - Agregado processTranscription

### Deprecados (pero mantenidos para compatibilidad)

- 🔶 `src/hooks/useAudioRecorder.ts` - Ya no se usa
- 🔶 `OrderChatContext.processAudio()` - Ya no se usa

## Próximos Pasos (Opcional)

1. **Monitoreo**: Agregar telemetría para rastrear uso de audio
2. **Analytics**: Medir duración promedio, tasa de error, retries
3. **Optimización**: Compresión de audio antes de upload
4. **Offline Support**: Queue de audios cuando no hay conexión
5. **Limpieza**: Eliminar código deprecado después de verificar que todo funciona

## Conclusión

Esta refactorización elimina completamente el problema de duplicación de requests que causaba errores de rate limit. El nuevo sistema es:

- ✅ **Robusto**: Manejo completo de errores
- ✅ **Predecible**: State machine clara
- ✅ **Eficiente**: Idempotencia garantizada
- ✅ **Escalable**: Rate limiting proactivo
- ✅ **Mantenible**: Código limpio y tipado

**Resultado esperado**: 0 errores de rate limit por duplicación de audios.
