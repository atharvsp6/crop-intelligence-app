import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel, CircularProgress, Paper } from '@mui/material';
import axios from 'axios';
import { API_BASE } from '../config';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  language: string;
  timestamp: string;
}

const languageOptions: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'bn', name: 'Bengali' },
  { code: 'auto', name: 'Auto Detect' }
];

const MultilingualChatbot: React.FC = () => {
  const [language, setLanguage] = useState('auto');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sendMessage = async () => {
    if (!query.trim()) return;
    const userMessage: ChatMessage = { role: 'user', text: query, language, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/mchatbot`, { query, language });
      if (res.data.success) {
        const botMsg: ChatMessage = {
          role: 'bot',
            text: res.data.response,
            language: res.data.detected_language || language,
            timestamp: res.data.timestamp || new Date().toISOString()
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const botMsg: ChatMessage = { role: 'bot', text: res.data.error || 'Error', language: 'en', timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (e:any) {
      let errText = 'Request failed';
      if (e.response && e.response.status === 503) {
        try {
          const status = await axios.get(`${API_BASE}/api/mchatbot/status`);
          if (status.data && status.data.error) {
            errText = `Service unavailable: ${status.data.error}`;
          } else {
            errText = 'Service unavailable (multilingual chatbot disabled).';
          }
        } catch {
          errText = 'Service unavailable (status check failed).';
        }
      }
      const botMsg: ChatMessage = { role: 'bot', text: errText, language: 'en', timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
      setQuery('');
    }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Multilingual Agricultural Chatbot</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Language</InputLabel>
            <Select value={language} label="Language" onChange={e => setLanguage(e.target.value)}>
              {languageOptions.map(l => <MenuItem key={l.code} value={l.code}>{l.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label="Ask a question"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }}
          />
          <Button variant="contained" onClick={sendMessage} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Send'}
          </Button>
        </Box>
        <Box sx={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {messages.map((m,i) => (
            <Paper key={i} sx={{ p: 1, bgcolor: m.role==='user' ? 'primary.light' : 'grey.100', alignSelf: m.role==='user' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
              <Typography variant="caption" color="text.secondary">{m.role === 'user' ? 'You' : 'Bot'} ({m.language})</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.text}</Typography>
            </Paper>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MultilingualChatbot;
