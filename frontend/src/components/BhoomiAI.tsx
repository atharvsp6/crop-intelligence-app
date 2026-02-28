/**
 * BhoomiAI.tsx – Unified multimodal assistant for YieldWise.
 *
 * Replaces VoiceCommandButton. Supports text + voice input through a single
 * backend pipeline: POST /api/bhoomi/process.
 *
 * Features:
 * - Floating action button
 * - Slide-up chat-style panel
 * - Text input + voice (Web Speech API) recording
 * - Auto-navigation on navigate_to
 * - Speech synthesis for responses
 * - Conversation history state
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Fab,
  Typography,
  IconButton,
  TextField,
  CircularProgress,
  Slide,
  Paper,
  Stack,
  Chip,
  Zoom,
  useTheme,
  alpha,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  SmartToy,
  Close,
  Mic,
  Stop,
  Send,
  VolumeUp,
  VolumeOff,
  DeleteSweep,
  NavigateNext,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';
import {
  startRecording,
  stopAndTranscribe,
  isRecording as checkIsRecording,
} from '../services/groqSpeech';

/* ── Types ──────────────────────────────────────────────────── */

interface BhoomiResponse {
  success: boolean;
  intent: string;
  confidence: number;
  entities: Record<string, unknown>;
  response_text: string;
  data: Record<string, unknown>;
  navigate_to: string | null;
  requires_followup: boolean;
  error?: string;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  confidence?: number;
  navigate_to?: string | null;
  timestamp: Date;
}

/* ── Quick-action chips ─────────────────────────────────────── */

const QUICK_ACTIONS = [
  { label: 'Check weather', message: 'What is the weather today?' },
  { label: 'Market prices', message: 'Show me today\'s mandi prices for wheat' },
  { label: 'Crop advice', message: 'Which crops should I grow this season?' },
  { label: 'Detect disease', message: 'My tomato plant has yellow spots on leaves' },
];

/* ── Component ──────────────────────────────────────────────── */

const BhoomiAI: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Panel state
  const [open, setOpen] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const msgIdRef = useRef(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voice state
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  // TTS state
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const synthRef = useRef(window.speechSynthesis);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Helpers ──────────────────────────────────────────────── */

  const addMessage = useCallback(
    (role: 'user' | 'assistant', content: string, extra?: Partial<ChatMessage>) => {
      msgIdRef.current += 1;
      const msg: ChatMessage = {
        id: msgIdRef.current,
        role,
        content,
        timestamp: new Date(),
        ...extra,
      };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    [],
  );

  const speak = useCallback(
    (text: string) => {
      if (!ttsEnabled || !text) return;
      synthRef.current.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.05;
      utt.pitch = 1.0;
      utt.lang = 'en-IN';
      synthRef.current.speak(utt);
    },
    [ttsEnabled],
  );

  /* ── Core send ───────────────────────────────────────────── */

  const sendMessage = useCallback(
    async (text: string, inputType: 'text' | 'voice' = 'text') => {
      if (!text.trim() || loading) return;

      addMessage('user', text);
      setInput('');
      setLoading(true);

      try {
        const res = await axios.post<BhoomiResponse>(
          `${API_BASE}/api/bhoomi/process`,
          { message: text, input_type: inputType },
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
        );

        const d = res.data;
        addMessage('assistant', d.response_text || 'I couldn\'t process that.', {
          intent: d.intent,
          confidence: d.confidence,
          navigate_to: d.navigate_to,
        });

        // Speak the response
        if (d.response_text) speak(d.response_text);

        // Auto-navigate after a short delay
        if (d.navigate_to) {
          setTimeout(() => {
            navigate(d.navigate_to as string);
          }, 1800);
        }
      } catch (err: any) {
        const errMsg =
          err?.response?.data?.response_text ||
          err?.response?.data?.error ||
          'Something went wrong. Please try again.';
        addMessage('assistant', errMsg);
      } finally {
        setLoading(false);
      }
    },
    [token, loading, addMessage, speak, navigate],
  );

  /* ── Voice ───────────────────────────────────────────────── */

  const handleVoiceToggle = useCallback(async () => {
    if (recording || checkIsRecording()) {
      // Stop & transcribe
      setRecording(false);
      setTranscribing(true);
      try {
        const stt = await stopAndTranscribe();
        setTranscribing(false);
        if (stt.success && stt.text) {
          await sendMessage(stt.text, 'voice');
        } else {
          addMessage('assistant', 'I couldn\'t hear that clearly. Could you try again?');
        }
      } catch {
        setTranscribing(false);
        addMessage('assistant', 'Voice recording failed. Please try again or type your message.');
      }
    } else {
      // Start recording
      try {
        await startRecording();
        setRecording(true);
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          addMessage('assistant', 'Microphone access denied. Please allow microphone access in your browser settings.');
        } else {
          addMessage('assistant', 'Could not start microphone. Please type your question instead.');
        }
      }
    }
  }, [recording, sendMessage, addMessage]);

  /* ── Clear history ───────────────────────────────────────── */

  const handleClear = useCallback(async () => {
    setMessages([]);
    synthRef.current.cancel();
    try {
      await axios.post(
        `${API_BASE}/api/bhoomi/clear-history`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
      );
    } catch {
      // Silent fail — local state is cleared regardless
    }
  }, [token]);

  /* ── Key handler ─────────────────────────────────────────── */

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  /* ── Derived ─────────────────────────────────────────────── */

  const panelBg = isDark
    ? 'linear-gradient(160deg, rgba(14,20,17,0.97) 0%, rgba(10,15,12,0.95) 100%)'
    : 'linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(245,250,246,0.96) 100%)';

  const accentGreen = isDark ? '#7ddf92' : '#2f855a';

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <>
      {/* ── FAB ──────────────────────────────────────────── */}
      <Zoom in={!open}>
        <Fab
          onClick={() => setOpen(true)}
          aria-label="Open Bhoomi AI"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1300,
            width: 62,
            height: 62,
            background: `linear-gradient(135deg, ${accentGreen} 0%, ${isDark ? '#48bb78' : '#38a169'} 100%)`,
            color: '#fff',
            boxShadow: `0 8px 28px ${alpha(accentGreen, 0.45)}`,
            '&:hover': {
              background: `linear-gradient(135deg, ${isDark ? '#63c07a' : '#276749'} 0%, ${isDark ? '#38a169' : '#2f855a'} 100%)`,
              boxShadow: `0 12px 36px ${alpha(accentGreen, 0.55)}`,
            },
          }}
        >
          <SmartToy sx={{ fontSize: 30 }} />
        </Fab>
      </Zoom>

      {/* ── Chat Panel ───────────────────────────────────── */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={24}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            width: { xs: 'calc(100vw - 32px)', sm: 400 },
            maxHeight: { xs: 'calc(100vh - 100px)', sm: 560 },
            zIndex: 1400,
            borderRadius: '22px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: panelBg,
            backdropFilter: 'blur(24px)',
            border: `1px solid ${alpha(accentGreen, isDark ? 0.15 : 0.12)}`,
            boxShadow: isDark
              ? `0 24px 72px rgba(0,0,0,0.7), 0 0 0 1px ${alpha(accentGreen, 0.1)}`
              : `0 24px 72px rgba(0,0,0,0.12), 0 0 0 1px ${alpha(accentGreen, 0.08)}`,
          }}
        >
          {/* ── Header ───────────────────────────────────── */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderBottom: `1px solid ${alpha(accentGreen, isDark ? 0.12 : 0.08)}`,
              background: alpha(accentGreen, isDark ? 0.06 : 0.04),
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '12px',
                display: 'grid',
                placeItems: 'center',
                background: `linear-gradient(135deg, ${accentGreen}, ${isDark ? '#48bb78' : '#38a169'})`,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <SmartToy sx={{ fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                Bhoomi AI
              </Typography>
              <Typography variant="caption" color="text.secondary" lineHeight={1}>
                Your farming assistant
              </Typography>
            </Box>

            <Tooltip title={ttsEnabled ? 'Mute voice' : 'Unmute voice'}>
              <IconButton size="small" onClick={() => { setTtsEnabled((p) => !p); synthRef.current.cancel(); }}>
                {ttsEnabled ? <VolumeUp fontSize="small" /> : <VolumeOff fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear chat">
              <IconButton size="small" onClick={handleClear}>
                <DeleteSweep fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton size="small" onClick={() => setOpen(false)}>
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* ── Messages area ────────────────────────────── */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 2,
              py: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              minHeight: 200,
            }}
          >
            {/* Welcome state */}
            {messages.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 3, opacity: 0.85 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 2,
                    borderRadius: '18px',
                    display: 'grid',
                    placeItems: 'center',
                    background: alpha(accentGreen, isDark ? 0.12 : 0.08),
                  }}
                >
                  <SmartToy sx={{ fontSize: 32, color: accentGreen }} />
                </Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Namaste! I'm Bhoomi AI 🌾
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  Ask me about crops, weather, diseases, market prices, or anything farming-related.
                </Typography>

                <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={0.75}>
                  {QUICK_ACTIONS.map((qa) => (
                    <Chip
                      key={qa.label}
                      label={qa.label}
                      size="small"
                      variant="outlined"
                      onClick={() => sendMessage(qa.message)}
                      sx={{
                        cursor: 'pointer',
                        borderColor: alpha(accentGreen, 0.3),
                        color: 'text.secondary',
                        fontSize: '0.72rem',
                        '&:hover': {
                          borderColor: accentGreen,
                          color: accentGreen,
                          bgcolor: alpha(accentGreen, 0.06),
                        },
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Message bubbles */}
            {messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Box
                  sx={{
                    maxWidth: '85%',
                    px: 1.75,
                    py: 1.25,
                    borderRadius:
                      msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    bgcolor:
                      msg.role === 'user'
                        ? alpha(accentGreen, isDark ? 0.18 : 0.12)
                        : alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04),
                    border: `1px solid ${alpha(
                      msg.role === 'user' ? accentGreen : theme.palette.divider,
                      msg.role === 'user' ? 0.2 : 0.5,
                    )}`,
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, fontSize: '0.82rem' }}>
                    {msg.content}
                  </Typography>

                  {/* Navigation chip */}
                  {msg.navigate_to && (
                    <Chip
                      label={`Go to ${msg.navigate_to.split('/').pop()?.replace('-', ' ')}`}
                      size="small"
                      icon={<NavigateNext />}
                      onClick={() => navigate(msg.navigate_to!)}
                      sx={{
                        mt: 1,
                        cursor: 'pointer',
                        bgcolor: alpha(accentGreen, 0.12),
                        color: accentGreen,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        '& .MuiChip-icon': { color: accentGreen },
                      }}
                    />
                  )}
                </Box>
              </Box>
            ))}

            {/* Loading indicator */}
            {(loading || transcribing) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
                <CircularProgress size={16} sx={{ color: accentGreen }} />
                <Typography variant="caption" color="text.secondary">
                  {transcribing ? 'Transcribing…' : 'Thinking…'}
                </Typography>
              </Box>
            )}

            <div ref={chatEndRef} />
          </Box>

          {/* ── Input area ───────────────────────────────── */}
          <Box
            sx={{
              px: 1.5,
              py: 1.25,
              borderTop: `1px solid ${alpha(accentGreen, isDark ? 0.1 : 0.06)}`,
              background: alpha(accentGreen, isDark ? 0.03 : 0.02),
            }}
          >
            <Stack direction="row" alignItems="flex-end" gap={0.75}>
              {/* Voice button */}
              <Tooltip title={recording ? 'Stop recording' : 'Voice input'}>
                <IconButton
                  onClick={handleVoiceToggle}
                  disabled={loading || transcribing}
                  size="small"
                  sx={{
                    color: recording ? theme.palette.error.main : alpha(accentGreen, 0.7),
                    bgcolor: recording ? alpha(theme.palette.error.main, 0.1) : 'transparent',
                    animation: recording
                      ? 'bhoomiPulse 1.5s ease-in-out infinite'
                      : 'none',
                    '@keyframes bhoomiPulse': {
                      '0%': { boxShadow: '0 0 0 0 rgba(244,67,54,0.4)' },
                      '70%': { boxShadow: '0 0 0 10px rgba(244,67,54,0)' },
                      '100%': { boxShadow: '0 0 0 0 rgba(244,67,54,0)' },
                    },
                  }}
                >
                  {recording ? <Stop /> : <Mic />}
                </IconButton>
              </Tooltip>

              {/* Text input */}
              <TextField
                fullWidth
                size="small"
                multiline
                maxRows={3}
                placeholder={recording ? 'Listening…' : 'Ask Bhoomi AI…'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading || recording || transcribing}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => sendMessage(input)}
                          disabled={!input.trim() || loading}
                          sx={{ color: accentGreen }}
                        >
                          <Send fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '14px',
                      bgcolor: alpha(theme.palette.background.paper, isDark ? 0.5 : 0.8),
                      fontSize: '0.85rem',
                      '& fieldset': {
                        borderColor: alpha(accentGreen, 0.15),
                      },
                      '&:hover fieldset': {
                        borderColor: alpha(accentGreen, 0.3),
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: `${accentGreen} !important`,
                      },
                    },
                  },
                }}
              />
            </Stack>

            {recording && (
              <Typography
                variant="caption"
                color="error.main"
                fontWeight={600}
                sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}
              >
                🎙️ Listening… tap stop when done
              </Typography>
            )}
          </Box>
        </Paper>
      </Slide>
    </>
  );
};

export default BhoomiAI;
