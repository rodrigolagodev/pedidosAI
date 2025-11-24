/**
 * Tipos para el sistema de audio/transcripción
 * Define una máquina de estados clara para el flujo completo
 */

export const MAX_RECORDING_DURATION = 5 * 60; // 5 minutos en segundos
export const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB (Groq limit es 25MB)
export const MAX_RECORDINGS_PER_HOUR = 10; // Límite de grabaciones por hora

/**
 * Estados posibles del sistema de audio
 */
export type AudioState =
  | { status: 'idle' }
  | { status: 'recording'; startTime: number; duration: number }
  | {
      status: 'recorded';
      blob: Blob;
      duration: number;
      size: number;
    }
  | {
      status: 'validating';
      blob: Blob;
    }
  | {
      status: 'uploading';
      blob: Blob;
      progress: number;
    }
  | {
      status: 'transcribing';
      audioFileId: string;
    }
  | {
      status: 'success';
      transcription: string;
      audioFileId: string;
      duration: number;
    }
  | {
      status: 'error';
      error: AudioError;
      blob?: Blob;
      retryable: boolean;
    };

/**
 * Errores tipados del sistema de audio
 */
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

/**
 * Metadata de una grabación procesada
 */
export interface ProcessedRecording {
  blobHash: string;
  timestamp: number;
  duration: number;
  size: number;
  transcription?: string;
}

/**
 * Configuración del sistema de audio
 */
export interface AudioConfig {
  maxDuration: number;
  maxSize: number;
  maxRecordingsPerHour: number;
  autoStopAtLimit: boolean;
  enableValidation: boolean;
}

/**
 * Resultado de la transcripción
 */
export interface TranscriptionResult {
  transcription: string;
  audioFileId: string;
  confidence: number;
  duration: number;
  orderId?: string; // The orderId used for creating/storing the audio
}
