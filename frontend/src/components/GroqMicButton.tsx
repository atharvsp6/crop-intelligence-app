/**
 * GroqMicButton – A reusable microphone button that records audio,
 * sends it to Groq Whisper for transcription, and returns the text.
 *
 * Usage:
 *   <GroqMicButton onTranscript={(text) => setQuery(text)} language="en" />
 */
import React, { useState, useCallback } from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Mic, Stop } from '@mui/icons-material';
import {
  startRecording,
  stopAndTranscribe,
  isRecording as checkRecording,
} from '../services/groqSpeech';

interface GroqMicButtonProps {
  /** Called with the transcribed text when recording stops */
  onTranscript: (text: string) => void;
  /** Optional language code (e.g. 'en', 'hi'). Defaults to auto-detect */
  language?: string;
  /** Size of the icon button */
  size?: 'small' | 'medium' | 'large';
  /** Disable the button */
  disabled?: boolean;
  /** Optional: called when recording starts */
  onRecordingStart?: () => void;
  /** Optional: called on error */
  onError?: (error: string) => void;
}

const GroqMicButton: React.FC<GroqMicButtonProps> = ({
  onTranscript,
  language = 'auto',
  size = 'medium',
  disabled = false,
  onRecordingStart,
  onError,
}) => {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const toggleRecording = useCallback(async () => {
    if (transcribing) return;

    if (recording || checkRecording()) {
      // Stop and transcribe
      setRecording(false);
      setTranscribing(true);
      try {
        const result = await stopAndTranscribe(language);
        if (result.success && result.text) {
          onTranscript(result.text);
        } else {
          onError?.(result.error || 'Transcription failed – no text returned');
        }
      } catch (err: any) {
        onError?.(err.message || 'Failed to transcribe audio');
      } finally {
        setTranscribing(false);
      }
    } else {
      // Start recording
      try {
        await startRecording();
        setRecording(true);
        onRecordingStart?.();
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          onError?.('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          onError?.('No microphone found. Please connect a microphone.');
        } else {
          onError?.(err.message || 'Failed to start recording');
        }
      }
    }
  }, [recording, transcribing, language, onTranscript, onRecordingStart, onError]);

  const getIcon = () => {
    if (transcribing) return <CircularProgress size={20} />;
    if (recording) return <Stop />;
    return <Mic />;
  };

  const getTooltip = () => {
    if (transcribing) return 'Transcribing...';
    if (recording) return 'Click to stop & transcribe';
    return 'Click to speak (Groq Whisper)';
  };

  const getColor = (): 'error' | 'default' | 'primary' => {
    if (transcribing) return 'primary';
    if (recording) return 'error';
    return 'default';
  };

  return (
    <Tooltip title={getTooltip()}>
      <span>
        <IconButton
          onClick={toggleRecording}
          color={getColor()}
          size={size}
          disabled={disabled || transcribing}
          sx={
            recording
              ? {
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244,67,54,0.4)' },
                    '50%': { transform: 'scale(1.1)', boxShadow: '0 0 0 8px rgba(244,67,54,0)' },
                    '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244,67,54,0)' },
                  },
                }
              : {}
          }
        >
          {getIcon()}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default GroqMicButton;
