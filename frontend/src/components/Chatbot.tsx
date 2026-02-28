import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  Agriculture,
  LocalHospital,
  WbSunny,
  Clear,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../config';
import GroqMicButton from './GroqMicButton';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  context?: any;
}

interface ChatResponse {
  success: boolean;
  response?: string;
  fallback_response?: string;
  error?: string;
  timestamp?: string;
  context_used?: boolean;
}

const Chatbot: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: `Hello${user?.name ? ` ${user.name}` : ''}! I'm your farming assistant. I can help you with crop recommendations, disease identification, market advice, and weather planning. What would you like to know?`,
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [userLocation, setUserLocation] = useState<{lat: number; lon: number} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {},
        { timeout: 5000, enableHighAccuracy: false }
      );
    }
  }, []);

  const quickActions = [
    {
      label: 'Crop Recommendations',
      icon: <Agriculture />,
      action: () => sendQuickMessage('Can you recommend the best crops to grow this season?'),
    },
    {
      label: 'Disease Help',
      icon: <LocalHospital />,
      action: () => sendQuickMessage('My plants are showing yellow spots on leaves. What could be wrong?'),
    },
    {
      label: 'Weather Advice',
      icon: <WbSunny />,
      action: () => sendQuickMessage('Heavy rain is expected next week. How should I prepare my crops?'),
    },
  ];

  const sampleQuestions = [
    'What are the optimal growing conditions for tomatoes?',
    'How can I improve soil fertility naturally?',
    'When is the best time to harvest wheat?',
    'What are signs of nitrogen deficiency in crops?',
    'How do I control pest infestation organically?',
    'What irrigation method works best for corn?',
    'How can I increase crop yield on small farms?',
    'What are the benefits of crop rotation?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (message: string, context?: any) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
      context,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axios.post<ChatResponse>(`${API_BASE}/api/chatbot/chat`, {
        message,
        context,
        lat: userLocation?.lat,
        lon: userLocation?.lon,
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.response || response.data.fallback_response || 'Sorry, I couldn\'t process your request.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Chatbot error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: error.response?.status === 401 
          ? 'Please log in to continue using the chatbot.'
          : 'I\'m having trouble connecting right now. Please make sure you\'re logged in and try again. Here are some general farming tips:\n\n• Test your soil regularly for pH and nutrients\n• Rotate crops to maintain soil health\n• Use integrated pest management\n• Monitor weather conditions for planning\n• Contact your local agricultural extension office',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const sendQuickMessage = (message: string) => {
    setActiveTab(0);
    sendMessage(message);
  };

  const sendSpecializedQuery = async (type: string, data: any) => {
    let message = '';
    let context = {};

    switch (type) {
      case 'crop-recommendation':
        message = `Please recommend crops suitable for: ${JSON.stringify(data)}`;
        context = { type: 'crop_recommendation', data };
        break;
      case 'problem-analysis':
        message = `Please analyze this farming problem: ${JSON.stringify(data)}`;
        context = { type: 'problem_analysis', data };
        break;
      case 'weather-advice':
        message = `Please provide weather-related farming advice for: ${JSON.stringify(data)}`;
        context = { type: 'weather_advice', data };
        break;
      default:
        return;
    }

    setActiveTab(0);
    await sendMessage(message, context);
  };

  const clearChat = async () => {
    try {
      await axios.post(`${API_BASE}/api/chatbot/clear-history`);
    } catch (error) {
      console.log('Could not clear server-side chat history');
    }
    
    setMessages([
      {
        id: '1',
        text: 'Chat cleared! I\'m ready to help you with farming questions again. What would you like to know?',
        isUser: false,
        timestamp: new Date(),
      }
    ]);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const accentColor = dark ? theme.palette.primary.main : theme.palette.primary.dark;

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Page Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              background: `linear-gradient(135deg, ${alpha(accentColor, 0.15)} 0%, ${alpha(accentColor, 0.08)} 100%)`,
              border: `1px solid ${alpha(accentColor, 0.2)}`,
              display: 'grid',
              placeItems: 'center',
              color: 'primary.main',
            }}
          >
            <SmartToy />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
              Farming Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get instant advice on crops, diseases, weather, and market trends
            </Typography>
          </Box>
        </Box>
      </Box>

      <Card sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        borderRadius: 3,
        border: `1px solid ${alpha(accentColor, dark ? 0.15 : 0.1)}`,
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
              },
            }}
          >
            <Tab label="Chat" />
            <Tab label="Quick Actions" />
            <Tab label="Sample Questions" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <>
            {/* Chat Messages */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {messages.map((message) => (
                <Box key={message.id} sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-start',
                      gap: 1,
                    }}
                  >
                    {!message.isUser && (
                      <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                        <SmartToy sx={{ fontSize: 20 }} />
                      </Avatar>
                    )}
                    
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        borderRadius: 2.5,
                        ...(message.isUser
                          ? {
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              borderBottomRightRadius: 4,
                            }
                          : {
                              bgcolor: dark
                                ? alpha(theme.palette.background.paper, 0.6)
                                : alpha(theme.palette.action.hover, 0.5),
                              color: 'text.primary',
                              border: `1px solid ${theme.palette.divider}`,
                              borderBottomLeftRadius: 4,
                            }),
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {message.text}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.8,
                          opacity: 0.6,
                          textAlign: 'right',
                          fontSize: '0.7rem',
                        }}
                      >
                        {formatTimestamp(message.timestamp)}
                      </Typography>
                    </Paper>
                    
                    {message.isUser && (
                      <Avatar
                        src={user?.profile_photo || undefined}
                        sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}
                      >
                        {!user?.profile_photo && <Person sx={{ fontSize: 20 }} />}
                      </Avatar>
                    )}
                  </Box>
                </Box>
              ))}
              
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                    <SmartToy sx={{ fontSize: 20 }} />
                  </Avatar>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      bgcolor: dark
                        ? alpha(theme.palette.background.paper, 0.6)
                        : alpha(theme.palette.action.hover, 0.5),
                      border: `1px solid ${theme.palette.divider}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      Thinking...
                    </Typography>
                  </Paper>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Ask me anything about farming..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(inputMessage);
                    }
                  }}
                  disabled={loading}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => sendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || loading}
                  sx={{ minWidth: 'auto', px: 2, borderRadius: 2.5, height: 40 }}
                >
                  <Send sx={{ fontSize: 20 }} />
                </Button>
                <GroqMicButton
                  onTranscript={(text) => {
                    setInputMessage(text);
                    setTimeout(() => sendMessage(text), 300);
                  }}
                  onError={(err) => console.error('Mic error:', err)}
                  size="medium"
                />
                <IconButton onClick={clearChat} color="secondary" sx={{ width: 40, height: 40 }}>
                  <Clear sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
            </Box>
          </>
        )}

        {activeTab === 1 && (
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  elevation={0}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2.5,
                    '&:hover': {
                      borderColor: alpha(accentColor, 0.4),
                      backgroundColor: alpha(accentColor, 0.04),
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 24px ${alpha(accentColor, 0.1)}`,
                    },
                  }}
                  onClick={action.action}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{
                      color: 'primary.main',
                      mb: 1.5,
                      '& svg': { fontSize: 32 },
                    }}>
                      {action.icon}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {action.label}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Typography variant="subtitle1" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
              Specialized Queries
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Agriculture />}
                onClick={() => sendSpecializedQuery('crop-recommendation', {
                  crop_type: 'wheat',
                  location: 'North America',
                  season: 'spring'
                })}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  justifyContent: 'flex-start',
                  py: 1.2,
                }}
              >
                Get Wheat Growing Recommendations
              </Button>
              <Button
                variant="outlined"
                startIcon={<LocalHospital />}
                onClick={() => sendSpecializedQuery('problem-analysis', {
                  problem_description: 'Plants are wilting and leaves are turning yellow',
                  crop_type: 'tomato',
                  symptoms: 'yellowing leaves, wilting'
                })}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  justifyContent: 'flex-start',
                  py: 1.2,
                }}
              >
                Analyze Plant Problem
              </Button>
              <Button
                variant="outlined"
                startIcon={<WbSunny />}
                onClick={() => sendSpecializedQuery('weather-advice', {
                  weather_conditions: 'Heavy rain expected for 3 days',
                  crops: ['corn', 'wheat']
                })}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  justifyContent: 'flex-start',
                  py: 1.2,
                }}
              >
                Get Weather-Based Advice
              </Button>
            </Box>
          </CardContent>
        )}

        {activeTab === 2 && (
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Sample Questions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click on any question to ask it directly
            </Typography>
            <List
              disablePadding
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2.5,
                overflow: 'hidden',
              }}
            >
              {sampleQuestions.map((question, index) => (
                <React.Fragment key={index}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => {
                        setActiveTab(0);
                        sendMessage(question);
                      }}
                      sx={{
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: alpha(accentColor, 0.06),
                        },
                      }}
                    >
                      <ListItemText
                        primary={question}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < sampleQuestions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export default Chatbot;