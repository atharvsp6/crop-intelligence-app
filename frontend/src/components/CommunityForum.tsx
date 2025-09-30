import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  SelectChangeEvent,
} from '@mui/material';
import {
  Forum,
  Add,
  ThumbUp,
  Search,
  Language,
  Person,
  Send,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../config';
import { SUPPORTED_LANGUAGES } from '../i18n';

interface ForumPost {
  _id: string;
  title: string;
  content: string;
  author: string;
  language: string;
  category: string;
  likes: number;
  views: number;
  reply_count: number;
  created_at: string;
  tags: string[];
}

interface ForumReply {
  reply_id: string;
  content: string;
  author: string;
  language: string;
  created_at: string;
  likes: number;
}

interface PostDetail extends ForumPost {
  replies: ForumReply[];
}

const CommunityForum: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [currentUser] = useState('farmer_' + Math.random().toString(36).substr(2, 9));

  // Form states
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general',
    language: 'en',
  });
  const [newReply, setNewReply] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const languages = SUPPORTED_LANGUAGES.map(l => ({ code: l.code, name: l.nativeName || l.label }));

  const categories = [
    'cultivation',
    'pest_management',
    'irrigation',
    'fertilizers',
    'harvesting',
    'marketing',
    'weather',
    'general',
  ];

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedLanguage) params.append('language', selectedLanguage);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('limit', '20');

  const response = await axios.get(`${API_BASE}/api/forum/posts?${params}`);
      if (response.data.success) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage, selectedCategory]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const fetchPostDetail = async (postId: string) => {
    try {
  const response = await axios.get(`${API_BASE}/api/forum/posts/${postId}`);
      if (response.data.success) {
        setSelectedPost(response.data.post);
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch post details');
    }
  };

  const createPost = async () => {
    try {
  const response = await axios.post(`${API_BASE}/api/forum/posts`, {
        ...newPost,
        author: currentUser,
      });
      
      if (response.data.success) {
        setNewPost({ title: '', content: '', category: 'general', language: 'en' });
        setPostDialogOpen(false);
        fetchPosts();
      }
    } catch (error) {
      console.error('Failed to create post');
    }
  };

  const addReply = async () => {
    if (!selectedPost || !newReply.trim()) return;

    try {
      const response = await axios.post(
        `${API_BASE}/api/forum/posts/${selectedPost._id}/replies`,
        {
          content: newReply,
          author: currentUser,
          language: 'en',
        }
      );

      if (response.data.success) {
        setNewReply('');
        fetchPostDetail(selectedPost._id); // Refresh post details
      }
    } catch (error) {
      console.error('Failed to add reply');
    }
  };

  const likePost = async (postId: string) => {
    try {
  await axios.post(`${API_BASE}/api/forum/posts/${postId}/like`, {
        user: currentUser,
      });
      fetchPosts(); // Refresh posts to show updated like count
    } catch (error) {
      console.error('Failed to like post');
    }
  };

  const searchPosts = async () => {
    if (!searchQuery.trim()) {
      fetchPosts();
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('q', searchQuery);
      if (selectedLanguage) params.append('language', selectedLanguage);
      if (selectedCategory) params.append('category', selectedCategory);

  const response = await axios.get(`${API_BASE}/api/forum/search?${params}`);
      if (response.data.success) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <Forum sx={{ mr: 2, verticalAlign: 'bottom' }} />
        Community Forum
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Connect with farmers worldwide, share knowledge, and get help in multiple languages
      </Typography>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: { md: 2 } }}>
              <TextField
                fullWidth
                label="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPosts()}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={searchPosts}>
                      <Search />
                    </IconButton>
                  ),
                }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={selectedLanguage}
                  onChange={(e: SelectChangeEvent) => setSelectedLanguage(e.target.value)}
                >
                  <MenuItem value="">All Languages</MenuItem>
                  {(languages || []).map(lang => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e: SelectChangeEvent) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {(categories || []).map(category => (
                    <MenuItem key={category} value={category}>
                      {category.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 0.8, minWidth: 120 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<Add />}
                onClick={() => setPostDialogOpen(true)}
              >
                New Post
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Posts List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {(posts || []).map(post => (
            <Box key={post._id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 }
                }}
                onClick={() => fetchPostDetail(post._id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {post.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {post.content.length > 200 
                          ? `${post.content.substring(0, 200)}...` 
                          : post.content}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Chip
                      label={post.category.replace('_', ' ').toUpperCase()}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={languages.find(l => l.code === post.language)?.name || post.language}
                      size="small"
                      variant="outlined"
                      icon={<Language />}
                    />
                    {(post.tags || []).map(tag => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        <Person />
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">
                        {post.author}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(post.created_at)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            likePost(post._id);
                          }}
                        >
                          <ThumbUp />
                        </IconButton>
                        <Typography variant="body2">{post.likes}</Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        {post.reply_count} replies
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        {post.views} views
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Post Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedPost && (
          <>
            <DialogTitle>{selectedPost.title}</DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedPost.content}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Avatar sx={{ width: 32, height: 32 }}>
                  <Person />
                </Avatar>
                <Typography variant="body2">
                  By {selectedPost.author} • {formatDate(selectedPost.created_at)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Replies ({selectedPost?.replies?.length || 0})
              </Typography>

              <List>
                {(selectedPost?.replies || []).map(reply => (
                  <ListItem key={reply.reply_id} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body2" component="span">
                            {reply.author}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {formatDate(reply.created_at)}
                          </Typography>
                        </Box>
                      }
                      secondary={reply.content}
                    />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Write a reply..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                />
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  sx={{ mt: 1 }}
                  onClick={addReply}
                  disabled={!newReply.trim()}
                >
                  Post Reply
                </Button>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* New Post Dialog */}
      <Dialog open={postDialogOpen} onClose={() => setPostDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Post</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={newPost.title}
            onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Content"
            multiline
            rows={6}
            value={newPost.content}
            onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
            margin="normal"
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newPost.category}
                  onChange={(e: SelectChangeEvent) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                >
                  {(categories || []).map(category => (
                    <MenuItem key={category} value={category}>
                      {category.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={newPost.language}
                  onChange={(e: SelectChangeEvent) => setNewPost(prev => ({ ...prev, language: e.target.value }))}
                >
                  {(languages || []).map(lang => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={createPost}
            disabled={!newPost.title.trim() || !newPost.content.trim()}
          >
            Create Post
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityForum;