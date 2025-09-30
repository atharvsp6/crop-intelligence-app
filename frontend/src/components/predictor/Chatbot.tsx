import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Person, Send, SmartToy } from '@mui/icons-material';
import axios from 'axios';

import { API_BASE } from '../../config';
import { useAuth } from '../../context/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
}

export interface ChatbotContext {
  summaryLines: string[];
  recommendationHighlights: string[];
  languageHint?: string;
}

interface ChatbotProps {
  context: ChatbotContext | null;
  isPredictionReady: boolean;
}

const fallbackAssistantMessage = `I'm having trouble fetching a detailed answer right now. Please try again in a moment or rephrase your question.`;

const Chatbot: React.FC<ChatbotProps> = ({ context, isPredictionReady }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { isAuthenticated, token, isLoading: authLoading } = useAuth();
  const canChat = isAuthenticated && !authLoading;
  const helperSeverity: 'info' | 'warning' = !authLoading && !isAuthenticated ? 'warning' : 'info';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const introHelper = useMemo(() => {
    if (authLoading) {
      return 'Checking your sign-in status...';
    }
    if (!isAuthenticated) {
      return 'Log in to your account to chat with the assistant.';
    }
    if (!isPredictionReady) {
      return 'Run a crop prediction to unlock personalised answers. You can still ask general farming questions.';
    }
    return 'Ask follow-up questions about your predicted yield, the recommended actions, or type in your local language.';
  }, [authLoading, isAuthenticated, isPredictionReady]);

  const handleSend = async () => {
    const userQuestion = input.trim();
    if (!userQuestion || loading) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: userQuestion,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      if (!canChat || !token) {
        throw new Error('Please sign in to chat with the assistant.');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const payload = {
        message: userQuestion,
        context: context
          ? {
              summaryLines: context.summaryLines,
              recommendationHighlights: context.recommendationHighlights,
            }
          : undefined,
        languageHint: context?.languageHint,
        predictionReady: isPredictionReady,
      };

      const { data } = await axios.post(`${API_BASE}/api/chatbot/chat`, payload, { headers });

      const answerText = (data?.response ?? '').toString().trim();

      if (!data?.success) {
        throw new Error(answerText || data?.error || 'The assistant was unable to respond just now.');
      }

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        text: answerText || fallbackAssistantMessage,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: unknown) {
      console.error('Assistant error:', error);
      let errorMessage = 'Unable to connect to the assistant right now. Please try again soon.';

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = 'Your session has expired. Please log in again to continue chatting.';
        } else {
          const backendMessage =
            (typeof error.response?.data === 'string' && error.response.data) ||
            error.response?.data?.error ||
            error.response?.data?.response;
          if (backendMessage) {
            errorMessage = backendMessage;
          }
        }
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      setMessages(prev => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: 'error',
          text: errorMessage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isError = message.role === 'error';

    const bubbleStyles = {
      bgcolor: isUser
        ? theme.palette.primary.main
        : isError
          ? alpha(theme.palette.error.light, 0.85)
          : theme.palette.background.paper,
      color: isUser
        ? theme.palette.primary.contrastText
        : isError
          ? theme.palette.error.contrastText
          : theme.palette.text.primary,
      borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      px: 2.25,
      py: 1.5,
      boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
      border: isUser ? 'none' : `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
      maxWidth: '80%',
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-word' as const,
      lineHeight: 1.55,
      fontSize: '0.95rem',
    };

    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          gap: 1.25,
          alignItems: 'flex-start',
        }}
      >
        {!isUser && (
          <Avatar
            sx={{
              bgcolor: isError ? theme.palette.error.main : alpha(theme.palette.success.main, 0.15),
              color: isError ? theme.palette.error.contrastText : theme.palette.success.dark,
              width: 36,
              height: 36,
            }}
          >
            <SmartToy fontSize="small" />
          </Avatar>
        )}
        <Box sx={bubbleStyles}>{message.text}</Box>
        {isUser && (
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              width: 36,
              height: 36,
            }}
          >
            <Person fontSize="small" />
          </Avatar>
        )}
      </Box>
    );
  };

  return (
    <Paper
      elevation={4}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        background: `linear-gradient(180deg, ${alpha(theme.palette.success.light, 0.2)} 0%, ${alpha(
          theme.palette.background.default,
          0.9,
        )} 60%)`,
        border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`,
        boxShadow: '0 24px 40px -18px rgba(46,125,50,0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="h5" fontWeight={700} color={theme.palette.primary.dark} gutterBottom>
          Ask about your crop prediction
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Get answers and guidance in simple language.
        </Typography>
      </Box>

      {introHelper && (
        <Alert severity={helperSeverity} sx={{ borderRadius: 2 }}>
          {introHelper}
        </Alert>
      )}

      {context && (
        <Box
          sx={{
            borderRadius: 2,
            p: 2,
            backgroundColor: alpha(theme.palette.success.light, 0.18),
            border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`,
          }}
        >
          <Typography variant="subtitle2" color={theme.palette.success.dark} gutterBottom>
            Prediction snapshot
          </Typography>
          <Stack spacing={0.5}>
            {context.summaryLines.map((line, index) => (
              <Typography key={index} variant="body2" sx={{ color: theme.palette.text.primary }}>
                • {line}
              </Typography>
            ))}
          </Stack>
          {context.recommendationHighlights.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="subtitle2" color={theme.palette.success.dark} gutterBottom>
                Key actions suggested
              </Typography>
              <Stack spacing={0.5}>
                {context.recommendationHighlights.slice(0, 5).map((item, index) => (
                  <Typography key={index} variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {index + 1}. {item}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      )}

      <Box
        sx={{
          flexGrow: 1,
          minHeight: isMobile ? 240 : 320,
          maxHeight: 420,
          overflowY: 'auto',
          pr: 1,
          py: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {messages.length === 0 && !loading ? (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 2,
              color: theme.palette.text.secondary,
            }}
          >
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: theme.palette.success.dark,
                width: 54,
                height: 54,
                mb: 1.5,
              }}
            >
              <SmartToy />
            </Avatar>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Start the conversation
            </Typography>
            <Typography variant="body2">
              Ask how to improve your yield, request step-by-step actions, or type in Hindi/your local language.
            </Typography>
          </Box>
        ) : (
          messages.map(renderMessage)
        )}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={20} color="success" />
            <Typography variant="body2" color={theme.palette.text.secondary}>
              Preparing a clear answer for you…
            </Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'flex-end',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          multiline
          minRows={isMobile ? 2 : 1}
          maxRows={4}
          placeholder="Ask your crop question here…"
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || !canChat}
          sx={(theme) => {
            const dark = theme.palette.mode === 'dark';
            const baseBg = dark
              ? alpha(theme.palette.success.dark, 0.18)
              : alpha(theme.palette.success.light, 0.18);
            const hoverBg = dark
              ? alpha(theme.palette.success.dark, 0.28)
              : alpha(theme.palette.success.light, 0.28);
            const focusedBg = dark
              ? alpha(theme.palette.success.dark, 0.35)
              : alpha(theme.palette.success.light, 0.4);
            return {
              '& .MuiOutlinedInput-root': {
                borderRadius: 999,
                background: `linear-gradient(145deg, ${baseBg} 0%, ${alpha(theme.palette.background.default, 0.85)} 80%)`,
                transition: 'background-color 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                paddingRight: 1,
                '& textarea': {
                  paddingTop: theme.spacing(1.2),
                },
                '& fieldset': {
                  borderColor: alpha(theme.palette.success.main, 0.35),
                  borderWidth: 1.2,
                },
                '&:hover': {
                  background: `linear-gradient(145deg, ${hoverBg} 0%, ${alpha(theme.palette.background.default, 0.92)} 85%)`,
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.success.main,
                },
                '&.Mui-focused': {
                  background: `linear-gradient(145deg, ${focusedBg} 0%, ${alpha(theme.palette.background.default, 0.95)} 90%)`,
                  boxShadow: `0 0 0 3px ${alpha(theme.palette.success.main, 0.25)}`,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.success.dark,
                },
                '&.Mui-disabled': {
                  opacity: 0.6,
                  background: alpha(theme.palette.action.disabledBackground, 0.15),
                  boxShadow: 'none',
                },
              },
              '& .MuiInputBase-input, & textarea': {
                fontSize: '0.95rem',
                lineHeight: 1.5,
                color: theme.palette.text.primary,
                '::placeholder': {
                  color: alpha(theme.palette.text.primary, 0.45),
                  opacity: 1,
                },
              },
            };
          }}
        />
        <Button
          variant="contained"
          color="success"
          size="large"
          onClick={handleSend}
          disabled={!input.trim() || loading || !canChat}
          sx={{
            minWidth: isMobile ? '100%' : 140,
            borderRadius: 2.5,
            py: 1.2,
            px: 3,
            fontWeight: 600,
            display: 'flex',
            gap: 1,
            alignItems: 'center',
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : <Send fontSize="small" />}
          {!loading && 'Send'}
        </Button>
      </Box>
    </Paper>
  );
};

export default Chatbot;
