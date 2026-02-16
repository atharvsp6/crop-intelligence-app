/**
 * Groq Speech-to-Text service using Whisper model.
 * Records audio from the microphone and sends it to the backend
 * for transcription via Groq's whisper-large-v3-turbo model.
 */
import { API_BASE } from '../config';

// ─── Audio Recording ──────────────────────────────────────────────

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let recordingStream: MediaStream | null = null;

/**
 * Start recording audio from the microphone.
 */
export async function startRecording(): Promise<void> {
  if (mediaRecorder && mediaRecorder.state === 'recording') return;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      sampleRate: 16000,
      echoCancellation: true,
      noiseSuppression: true,
    },
  });
  recordingStream = stream;
  audioChunks = [];

  // Prefer webm/opus; fall back to whatever is available
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/webm')
    ? 'audio/webm'
    : '';

  mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.start(250); // collect data every 250ms
}

/**
 * Stop recording and return the audio blob.
 */
export function stopRecording(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      reject(new Error('No active recording'));
      return;
    }

    mediaRecorder.onstop = () => {
      const audioBlobType = mediaRecorder?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunks, { type: audioBlobType });
      audioChunks = [];

      // Stop all tracks to release the mic
      if (recordingStream) {
        recordingStream.getTracks().forEach((t) => t.stop());
        recordingStream = null;
      }

      resolve(audioBlob);
    };

    mediaRecorder.stop();
  });
}

/**
 * Check if currently recording.
 */
export function isRecording(): boolean {
  return mediaRecorder?.state === 'recording';
}

// ─── Groq Whisper Transcription ───────────────────────────────────

export interface TranscriptionResult {
  success: boolean;
  text: string;
  language?: string;
  error?: string;
}

/**
 * Send an audio blob to the backend for Groq Whisper transcription.
 */
export async function transcribeAudio(
  audioBlob: Blob,
  language: string = 'auto'
): Promise<TranscriptionResult> {
  const formData = new FormData();

  // Determine extension from MIME type
  const ext = audioBlob.type.includes('webm') ? 'webm' : audioBlob.type.includes('mp4') ? 'mp4' : 'wav';
  formData.append('audio', audioBlob, `recording.${ext}`);
  if (language && language !== 'auto') {
    formData.append('language', language);
  }

  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE}/api/groq/speech-to-text`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json();
  return data;
}

// ─── Voice Intent Classification ──────────────────────────────────

export interface VoiceIntentResult {
  success: boolean;
  intent?: {
    section: string;
    sub_tab: number | null;
    action: string;
    extracted_query: string;
    confidence: number;
    summary: string;
  };
  error?: string;
}

/**
 * Send transcribed text to the backend for intent classification.
 */
export async function classifyVoiceIntent(text: string): Promise<VoiceIntentResult> {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE}/api/groq/voice-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text }),
  });

  return res.json();
}

// ─── Combined: Record → Transcribe ────────────────────────────────

/**
 * Convenience: stop recording, transcribe, and return text.
 */
export async function stopAndTranscribe(language?: string): Promise<TranscriptionResult> {
  const blob = await stopRecording();
  return transcribeAudio(blob, language);
}

// ─── Voice Answer (for general questions) ─────────────────────────

export interface VoiceAnswerResult {
  success: boolean;
  answer?: string;
  error?: string;
}

/**
 * Get the user's current geolocation.
 */
export function getUserLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, enableHighAccuracy: false }
    );
  });
}

/**
 * Send a general question to the backend for a direct AI answer,
 * enriched with user location + name for weather/personalisation.
 */
export async function getVoiceAnswer(
  question: string,
  opts?: { userName?: string; lat?: number; lon?: number }
): Promise<VoiceAnswerResult> {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE}/api/groq/voice-answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      question,
      user_name: opts?.userName || '',
      lat: opts?.lat,
      lon: opts?.lon,
    }),
  });

  return res.json();
}
