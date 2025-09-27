import React, { useState, useRef } from 'react';
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI farming assistant. I can help you with crop recommendations, disease identification, market advice, and weather planning. What would you like to know?',
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    setActiveTab(0); // Switch to chat tab
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

    // Switch to chat tab and send the message
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

  return (
    <Box sx={{ flexGrow: 1, p: 3, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold' }}>
        <SmartToy sx={{ mr: 2, verticalAlign: 'bottom' }} />
        AI Farming Assistant
      </Typography>
      <Typography variant="body1" sx={{ color: '#e0e0e0', opacity: 0.9 }} paragraph>
        Get instant advice on crops, diseases, weather, and market trends
      </Typography>

      <Card sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        boxShadow: 3,
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
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
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <SmartToy />
                      </Avatar>
                    )}
                    
                    <Paper
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        bgcolor: message.isUser ? 'primary.main' : '#f5f5f5',
                        color: message.isUser ? 'white' : '#333333',
                        border: message.isUser ? 'none' : '1px solid #e0e0e0',
                      }}
                    >
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.text}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 1,
                          opacity: 0.7,
                          textAlign: 'right',
                        }}
                      >
                        {formatTimestamp(message.timestamp)}
                      </Typography>
                    </Paper>
                    
                    {message.isUser && (
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <Person />
                      </Avatar>
                    )}
                  </Box>
                </Box>
              ))}
              
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <SmartToy />
                  </Avatar>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: '#f5f5f5',
                    color: '#333333',
                    border: '1px solid #e0e0e0'
                  }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                      Thinking...
                    </Typography>
                  </Paper>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Ask me anything about farming..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(inputMessage);
                    }
                  }}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#b0b0b0',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: '#333333',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: '#888888',
                      opacity: 1,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => sendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || loading}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  <Send />
                </Button>
                <IconButton onClick={clearChat} color="secondary">
                  <Clear />
                </IconButton>
              </Box>
            </Box>
          </>
        )}

        {activeTab === 1 && (
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ 
              color: '#333333',
              fontWeight: 'bold',
            }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { 
                      boxShadow: 4,
                      backgroundColor: '#f0f0f0',
                    },
                    transition: 'all 0.3s',
                    backgroundColor: '#fafafa',
                    border: '2px solid #e0e0e0',
                  }}
                  onClick={action.action}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ 
                      color: 'primary.main', 
                      mb: 1,
                      fontSize: '2rem',
                    }}>
                      {action.icon}
                    </Box>
                    <Typography variant="body2" sx={{ 
                      color: '#333333',
                      fontWeight: '600',
                    }}>{action.label}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Typography variant="h6" sx={{ 
              mt: 4, 
              mb: 2,
              color: '#333333',
              fontWeight: 'bold',
            }}>
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
                  backgroundColor: '#f9f9f9',
                  color: '#333333',
                  borderColor: '#cccccc',
                  '&:hover': {
                    backgroundColor: '#f0f0f0',
                    borderColor: '#999999',
                  }
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
                  backgroundColor: '#f9f9f9',
                  color: '#333333',
                  borderColor: '#cccccc',
                  '&:hover': {
                    backgroundColor: '#f0f0f0',
                    borderColor: '#999999',
                  }
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
                  backgroundColor: '#f9f9f9',
                  color: '#333333',
                  borderColor: '#cccccc',
                  '&:hover': {
                    backgroundColor: '#f0f0f0',
                    borderColor: '#999999',
                  }
                }}
              >
                Get Weather-Based Advice
              </Button>
            </Box>
          </CardContent>
        )}

        {activeTab === 2 && (
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ 
              color: '#333333',
              fontWeight: 'bold',
            }}>
              Sample Questions
            </Typography>
            <Typography variant="body2" sx={{ color: '#666666' }} paragraph>
              Click on any question to ask it directly
            </Typography>
            <List sx={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e0e0e0',
              borderRadius: 1,
            }}>
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
                          backgroundColor: '#f5f5f5',
                        },
                      }}
                    >
                      <ListItemText
                        primary={question}
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          color: '#333333',
                          fontWeight: '500',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < sampleQuestions.length - 1 && <Divider sx={{ borderColor: '#e0e0e0' }} />}
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