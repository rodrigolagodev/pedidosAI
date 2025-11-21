'use client';

import React, { useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceRecorderButtonProps {
    onRecordingComplete: (blob: Blob) => void;
    isProcessing?: boolean;
    disabled?: boolean;
}

export function VoiceRecorderButton({
    onRecordingComplete,
    isProcessing = false,
    disabled = false
}: VoiceRecorderButtonProps) {
    const {
        isRecording,
        startRecording,
        stopRecording,
        audioBlob,
        recordingTime,
        error,
        reset
    } = useAudioRecorder();

    // Auto-submit when recording finishes
    useEffect(() => {
        if (audioBlob) {
            onRecordingComplete(audioBlob);
            reset();
        }
    }, [audioBlob, onRecordingComplete, reset]);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    if (error) {
        return (
            <div className="text-red-500 text-sm mb-2">
                {error}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {isRecording && (
                <span className="text-red-500 font-mono animate-pulse">
                    {formatTime(recordingTime)}
                </span>
            )}

            <Button
                size="icon"
                variant={isRecording ? "destructive" : "default"}
                className={cn(
                    "h-12 w-12 rounded-full transition-all duration-300 shadow-lg hover:scale-105",
                    isRecording && "ring-4 ring-red-200 scale-110"
                )}
                onClick={handleClick}
                disabled={disabled || isProcessing}
            >
                {isProcessing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : isRecording ? (
                    <Square className="h-5 w-5 fill-current" />
                ) : (
                    <Mic className="h-6 w-6" />
                )}
            </Button>
        </div>
    );
}
