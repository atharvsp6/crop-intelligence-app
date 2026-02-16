/**
 * VoiceCommandButton – A floating action button that lets users
 * speak a command to navigate the app or perform actions.
 *
 * Flow: Record audio → Groq Whisper STT → Groq LLM intent classification → Navigate
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Zoom,
  IconButton,
} from '@mui/material';
import { Mic, Stop, Close, Navigation, RecordVoiceOver } from '@mui/icons-material';
import {
  startRecording,
  stopAndTranscribe,
  classifyVoiceIntent,
  getVoiceAnswer,
  getUserLocation,
  isRecording as checkRecording,
} from '../services/groqSpeech';
import { useAuth } from '../context/AuthContext';

const SECTION_LABELS: Record<string, string> = {
  'dashboard': 'Dashboard',
  'crop-predictor': 'Crop Predictor',
  'disease-detector': 'Disease Detector',
  'financial-dashboard': 'Financial Dashboard',
  'market-intelligence': 'Market Intelligence',
  'mandi-data': 'Mandi Data',
  'community-forum': 'Community Forum',
  'chatbot': 'AI Chatbot',
  'multilingual-chatbot': 'Multilingual Chatbot',
  'smart-advisor': 'Smart AI Advisor',
  'profile': 'Profile',
};

const VoiceCommandButton: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [intent, setIntent] = useState<any>(null);
  const [voiceAnswer, setVoiceAnswer] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'idle' | 'recording' | 'transcribing' | 'classifying' | 'answering' | 'done'>('idle');

  const reset = useCallback(() => {
    setRecording(false);
    setProcessing(false);
    setTranscript('');
    setIntent(null);
    setVoiceAnswer('');
    setError('');
    setStep('idle');
  }, []);

  const handleOpen = useCallback(() => {
    setOpen(true);
    reset();
  }, [reset]);

  const handleClose = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  const handleStartRecording = useCallback(async () => {
    try {
      setError('');
      setTranscript('');
      setIntent(null);
      await startRecording();
      setRecording(true);
      setStep('recording');
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access.');
      } else {
        setError(err.message || 'Failed to start recording');
      }
    }
  }, []);

  const handleStopAndProcess = useCallback(async () => {
    setRecording(false);
    setProcessing(true);

    try {
      // Step 1: Transcribe
      setStep('transcribing');
      const sttResult = await stopAndTranscribe();

      if (!sttResult.success || !sttResult.text) {
        setError(sttResult.error || 'Could not transcribe audio. Please try again.');
        setStep('idle');
        setProcessing(false);
        return;
      }

      setTranscript(sttResult.text);

      // Step 2: Classify intent
      setStep('classifying');
      const intentResult = await classifyVoiceIntent(sttResult.text);

      if (intentResult.success && intentResult.intent) {
        setIntent(intentResult.intent);

        const section = intentResult.intent.section;
        const action = intentResult.intent.action;

        // If it's a general question (no navigable section), get an AI answer
        if (action === 'answer' || !section || section === 'none' || !SECTION_LABELS[section]) {
          setStep('answering');
          const query = intentResult.intent.extracted_query || sttResult.text;
          try {
            // Get user location for weather-aware answers
            const loc = await getUserLocation();
            const answerResult = await getVoiceAnswer(query, {
              userName: user?.name || user?.full_name || '',
              lat: loc?.lat,
              lon: loc?.lon,
            });
            if (answerResult.success && answerResult.answer) {
              setVoiceAnswer(answerResult.answer);
            } else {
              setVoiceAnswer('Sorry, I could not find an answer. Try navigating to the AI Chatbot for more help.');
            }
          } catch {
            setVoiceAnswer('Sorry, I could not get an answer right now. Try the AI Chatbot.');
          }
          setStep('done');
        } else if (SECTION_LABELS[section]) {
          setStep('done');
          // Auto-navigate after a brief delay
          setTimeout(() => {
            const path = section === 'dashboard' ? '/dashboard' : `/dashboard/${section}`;
            navigate(path);
            handleClose();
          }, 1500);
        } else {
          setStep('done');
        }
      } else {
        setError(intentResult.error || 'Could not understand the command.');
        setStep('idle');
      }
    } catch (err: any) {
      setError(err.message || 'Processing failed');
      setStep('idle');
    } finally {
      setProcessing(false);
    }
  }, [navigate, handleClose]);

  const toggleRecording = useCallback(() => {
    if (recording || checkRecording()) {
      handleStopAndProcess();
    } else {
      handleStartRecording();
    }
  }, [recording, handleStartRecording, handleStopAndProcess]);

  const navigateToSection = useCallback(
    (section: string) => {
      const path = section === 'dashboard' ? '/dashboard' : `/dashboard/${section}`;
      navigate(path);
      handleClose();
    },
    [navigate, handleClose]
  );

  return (
    <>
      {/* Floating Action Button */}
      <Zoom in>
        <Fab
          color="primary"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1300,
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #2f855a 0%, #48bb78 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #276749 0%, #38a169 100%)',
            },
          }}
          aria-label="Voice command"
        >
          <RecordVoiceOver />
        </Fab>
      </Zoom>

      {/* Voice Command Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RecordVoiceOver color="primary" />
            Voice Command
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Speak a command like "Show me crop predictions", "Go to disease detector",
            "Check market prices", or "Open the chatbot"
          </Typography>

          {/* Mic Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Fab
              color={recording ? 'error' : 'primary'}
              onClick={toggleRecording}
              disabled={processing}
              sx={{
                width: 80,
                height: 80,
                ...(recording
                  ? {
                      animation: 'voicePulse 1.5s ease-in-out infinite',
                      '@keyframes voicePulse': {
                        '0%': { boxShadow: '0 0 0 0 rgba(244,67,54,0.5)' },
                        '70%': { boxShadow: '0 0 0 20px rgba(244,67,54,0)' },
                        '100%': { boxShadow: '0 0 0 0 rgba(244,67,54,0)' },
                      },
                    }
                  : {}),
              }}
            >
              {processing ? <CircularProgress size={32} color="inherit" /> : recording ? <Stop sx={{ fontSize: 36 }} /> : <Mic sx={{ fontSize: 36 }} />}
            </Fab>
          </Box>

          {/* Status */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            {step === 'idle' && !error && (
              <Typography variant="body2" color="text.secondary">
                Tap the microphone and speak your command
              </Typography>
            )}
            {step === 'recording' && (
              <Typography variant="body1" fontWeight={600} color="error.main">
                Listening... Speak now
              </Typography>
            )}
            {step === 'transcribing' && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Transcribing your speech...</Typography>
              </Box>
            )}
            {step === 'classifying' && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Understanding your command...</Typography>
              </Box>
            )}
            {step === 'answering' && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Getting answer...</Typography>
              </Box>
            )}
          </Box>

          {/* Transcript */}
          {transcript && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>You said:</strong> "{transcript}"
              </Typography>
            </Alert>
          )}

          {/* Intent Result */}
          {intent && !voiceAnswer && (
            <Alert severity="success" sx={{ mb: 2 }} icon={<Navigation />}>
              <Typography variant="body2" fontWeight={600}>
                {intent.summary || `Navigating to ${SECTION_LABELS[intent.section] || intent.section}`}
              </Typography>
              {intent.section && SECTION_LABELS[intent.section] && (
                <Chip
                  label={`Go to ${SECTION_LABELS[intent.section]}`}
                  color="primary"
                  onClick={() => navigateToSection(intent.section)}
                  sx={{ mt: 1 }}
                  icon={<Navigation />}
                />
              )}
              {intent.extracted_query && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Query: {intent.extracted_query}
                </Typography>
              )}
            </Alert>
          )}

          {/* AI Voice Answer */}
          {voiceAnswer && (
            <Alert severity="success" sx={{ mb: 2, '& .MuiAlert-message': { width: '100%' } }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                {intent?.summary || 'AI Answer'}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {voiceAnswer}
              </Typography>
            </Alert>
          )}

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Quick Section Links */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Or tap to navigate:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Object.entries(SECTION_LABELS).map(([key, label]) => (
                <Chip
                  key={key}
                  label={label}
                  size="small"
                  variant="outlined"
                  onClick={() => navigateToSection(key)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceCommandButton;
