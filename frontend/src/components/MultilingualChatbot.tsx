import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Paper,
  IconButton,
  Chip,
  Alert,
  Stack,
  Avatar,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Send,
  Translate,
  SmartToy,
  Person,
  Agriculture,
  Clear,
  AutoAwesome,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../config';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  language: string;
  languageName?: string;
  timestamp: string;
  isError?: boolean;
}

const languageOptions: { code: string; name: string; flag: string }[] = [
  { code: 'auto', name: 'Auto Detect', flag: '🔍' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Odia)', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
];

const quickQuestions = [
  { text: "What fertilizer should I use for rice?", language: "en" },
  { text: "धान के लिए कौन सा उर्वरक उपयोग करना चाहिए?", language: "hi" },
  { text: "How to prevent pest attacks?", language: "en" },
  { text: "Best time to harvest wheat?", language: "en" },
];

const MultilingualChatbot: React.FC = () => {
  const [language, setLanguage] = useState('auto');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [serviceStatus, setServiceStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkServiceStatus = async () => {
    try {
      const status = await axios.get(`${API_BASE}/api/mchatbot/status`);
      if (!status.data.initialized) {
        setServiceStatus(status.data.init_error || status.data.import_error || 'Service not initialized');
      } else {
        setServiceStatus(null);
      }
    } catch (error) {
      setServiceStatus('Unable to check service status');
    }
  };

  useEffect(() => {
    checkServiceStatus();
  }, []);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || query;
    if (!textToSend.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: textToSend,
      language,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    
    try {
      const res = await axios.post(`${API_BASE}/api/mchatbot`, {
        query: textToSend,
        language: language === 'auto' ? 'auto' : language
      });
      
      if (res.data.success) {
        const botMsg: ChatMessage = {
          role: 'bot',
          text: res.data.response,
          language: res.data.detected_language || language,
          languageName: res.data.language_name,
          timestamp: res.data.timestamp || new Date().toISOString()
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const botMsg: ChatMessage = {
          role: 'bot',
          text: res.data.error || 'Sorry, I encountered an error',
          language: 'en',
          timestamp: new Date().toISOString(),
          isError: true
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (e: any) {
      let errText = 'Connection failed. Please check if the backend server is running.';
      if (e.response && e.response.status === 503) {
        await checkServiceStatus();
        errText = 'Multilingual chatbot service is currently unavailable. Please check the API configuration.';
      }
      const botMsg: ChatMessage = {
        role: 'bot',
        text: errText,
        language: 'en',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
      setQuery('');
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const selectedLanguage = languageOptions.find(l => l.code === language);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Card elevation={2}>
        <CardContent sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                width: 48,
                height: 48,
              }}
            >
              <Translate />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesome sx={{ color: 'primary.main' }} />
                Multilingual AI Assistant
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ask farming questions in your preferred Indian language
              </Typography>
            </Box>
            <IconButton onClick={clearChat} color="primary" title="Clear Chat">
              <Clear />
            </IconButton>
          </Box>

          {/* Service Status Alert */}
          {serviceStatus && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Service Issue:</strong> {serviceStatus}
              </Typography>
            </Alert>
          )}

          {/* Language Selection */}
          <FormControl fullWidth size="small">
            <InputLabel>Select Language</InputLabel>
            <Select
              value={language}
              label="Select Language"
              onChange={e => setLanguage(e.target.value)}
              startAdornment={selectedLanguage && (
                <Typography sx={{ mr: 1 }}>{selectedLanguage.flag}</Typography>
              )}
            >
              {languageOptions.map(l => (
                <MenuItem key={l.code} value={l.code}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>{l.flag}</Typography>
                    <Typography>{l.name}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Quick Questions */}
      {messages.length === 0 && (
        <Card elevation={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Agriculture color="primary" />
              Quick Start Questions
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {quickQuestions.map((q, i) => (
                <Chip
                  key={i}
                  label={q.text}
                  variant="outlined"
                  clickable
                  onClick={() => sendMessage(q.text)}
                  sx={{
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      borderColor: 'primary.main',
                    }
                  }}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }} elevation={2}>
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minHeight: 400,
            maxHeight: 600,
            bgcolor: alpha(theme.palette.background.paper, 0.5),
          }}
        >
          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <SmartToy sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                Start a conversation
              </Typography>
              <Typography variant="body2">
                Ask me anything about farming in your preferred language!
              </Typography>
            </Box>
          ) : (
            messages.map((m, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    maxWidth: '75%',
                    bgcolor: m.role === 'user'
                      ? 'primary.main'
                      : m.isError
                        ? 'error.light'
                        : 'background.paper',
                    color: m.role === 'user'
                      ? 'primary.contrastText'
                      : m.isError
                        ? 'error.contrastText'
                        : 'text.primary',
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: m.role === 'user' ? 'rgba(255,255,255,0.2)' : 'primary.main',
                      }}
                    >
                      {m.role === 'user' ? <Person sx={{ fontSize: 16 }} /> : <SmartToy sx={{ fontSize: 16 }} />}
                    </Avatar>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {m.role === 'user' ? 'You' : 'AI Assistant'}
                    </Typography>
                    {m.languageName && (
                      <Chip
                        size="small"
                        label={m.languageName}
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'inherit',
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.5,
                    }}
                  >
                    {m.text}
                  </Typography>
                </Paper>
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Divider />

        {/* Input Area */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder={`Type your farming question in ${selectedLanguage?.name || 'selected language'}...`}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                }
              }}
            />
            <Button
              variant="contained"
              size="large"
              onClick={() => sendMessage()}
              disabled={loading || !query.trim()}
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1.5,
                minWidth: 'auto',
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Send />
              )}
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Press Enter to send, Shift+Enter for new line
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default MultilingualChatbot;
