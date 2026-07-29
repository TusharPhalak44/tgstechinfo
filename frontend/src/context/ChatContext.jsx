import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';
import { message } from 'antd';
import { useAuth } from './AuthContext';

const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

const serializeMessages = (msgs) => msgs.map(m => ({
  ...m,
  timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
  data: m.data ? {
    ...m.data,
    onCategoryClick: undefined, onContentClick: undefined,
    onVisitPage: undefined, onContinueChat: undefined, onStopChat: undefined
  } : m.data
}));

// Storage helpers — logged-in users use localStorage with user-specific key, guests use sessionStorage
const getStorage = (userId) => userId ? localStorage : sessionStorage;
const getMsgKey = (userId) => userId ? `chatbot_messages_${userId}` : 'chatbot_messages_guest';
const getEndedKey = (userId) => userId ? `chatbot_ended_${userId}` : 'chatbot_ended_guest';

// For guests: tab_active flag is set once per JS session.
// On page refresh, JS memory resets but sessionStorage stays —
// we detect refresh by checking if flag was already set BEFORE this JS load.
// We use a two-key approach: one in sessionStorage (survives refresh) and
// one in a module-level variable (resets on refresh).
let _tabSessionInitialized = false;

const initGuestSession = () => {
  if (_tabSessionInitialized) return;
  _tabSessionInitialized = true;
  // Clear guest chat on every fresh JS load (refresh or new tab)
  sessionStorage.removeItem('chatbot_messages_guest');
  sessionStorage.removeItem('chatbot_ended_guest');
};

const loadMessages = (userId) => {
  try {
    const saved = getStorage(userId).getItem(getMsgKey(userId));
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const loadChatEnded = (userId) => {
  try {
    return getStorage(userId).getItem(getEndedKey(userId)) === 'true';
  } catch { return false; }
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || null;

  // Clear guest chat on every page refresh/load (module var resets on JS reload)
  if (!userId) initGuestSession();

  const [isOpen, setIsOpenState] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentIntent, setCurrentIntent] = useState(null);
  const [knowledgeBaseAnswer, setKnowledgeBaseAnswer] = useState(null);
  const [relatedSuggestions, setRelatedSuggestions] = useState([]);
  const [showQueryForm, setShowQueryForm] = useState(false);
  const [showBusinessInquiryForm, setShowBusinessInquiryForm] = useState(false);
  const [messages, setMessagesState] = useState(() => loadMessages(null));
  const [isTyping, setIsTyping] = useState(false);
  const [chatEnded, setChatEndedState] = useState(() => loadChatEnded(null));
  const [categories, setCategories] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  // When user logs in or out — load their specific chat history
  useEffect(() => {
    const savedMsgs = loadMessages(userId);
    const savedEnded = loadChatEnded(userId);
    setMessagesState(savedMsgs);
    setChatEndedState(savedEnded);
  }, [userId]);

  const saveMessages = useCallback((msgs, uid) => {
    try {
      getStorage(uid).setItem(getMsgKey(uid), JSON.stringify(serializeMessages(msgs)));
    } catch { /* silent */ }
  }, []);

  const setMessages = useCallback((updater) => {
    setMessagesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveMessages(next, userId);
      return next;
    });
  }, [userId, saveMessages]);

  const setChatEnded = useCallback((val) => {
    setChatEndedState(val);
    try { getStorage(userId).setItem(getEndedKey(userId), String(val)); } catch { /* silent */ }
  }, [userId]);

  const setIsOpen = (val) => {
    setIsOpenState(prev => typeof val === 'function' ? val(prev) : val);
  };

  useEffect(() => {
    let id = localStorage.getItem('chatbot_session_id');
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chatbot_session_id', id);
    }
    setSessionId(id);
  }, []);

  useEffect(() => {
    if (sessionId) createSession();
  }, [sessionId]);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadTrending();
      loadRecentSearches();
    }
  }, [isOpen]);

  const createSession = async () => {
    try {
      await api.post('/api/chatbot/session', {
        sessionId,
        visitorSessionId: localStorage.getItem('visitor_session_id') || `visitor_${Date.now()}`
      });
    } catch (e) { /* silent */ }
  };

  const loadCategories = async () => {
    try {
      const r = await api.get('/api/chatbot/categories');
      setCategories(r.data.categories || []);
    } catch (e) { /* silent */ }
  };

  const loadTrending = async () => {
    try {
      const r = await api.get('/api/chatbot/trending?limit=5');
      setTrending(r.data.results || []);
    } catch (e) { /* silent */ }
  };

  const loadRecentSearches = () => {
    const stored = localStorage.getItem('chatbot_recent_searches');
    if (stored) setRecentSearches(JSON.parse(stored));
  };

  const saveRecentSearch = (q) => {
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('chatbot_recent_searches', JSON.stringify(updated));
  };

  const removeRecentSearch = (q) => {
    const updated = recentSearches.filter(s => s !== q);
    setRecentSearches(updated);
    localStorage.setItem('chatbot_recent_searches', JSON.stringify(updated));
  };

  const search = async (searchQuery) => {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    setSearchResults([]);
    setSearchedQuery('');
    try {
      const response = await api.post('/api/chatbot/search', {
        query: q, searchType: 'keyword', sessionId, limit: 10
      });
      const results = response.data.results || [];
      setSearchResults(results);
      setSearchedQuery(q);
      saveRecentSearch(q);
      api.post('/api/chatbot/message', {
        sessionId, messageType: 'user', message: q,
        metadata: { searchType: 'keyword', resultsCount: results.length }
      }).catch(() => {});
    } catch (error) {
      message.error('Search failed. Please try again.');
      setSearchResults([]);
      setSearchedQuery(q);
    } finally {
      setIsSearching(false);
    }
  };

  const logClick = async (contentId, position = 0) => {
    try {
      await api.post('/api/chatbot/click', {
        sessionId, contentId, searchQuery: searchedQuery, searchType: 'keyword', position
      });
    } catch (e) { /* silent */ }
  };

  const clearSearch = () => {
    setSearchedQuery('');
    setSearchResults([]);
    setCurrentIntent(null);
    setKnowledgeBaseAnswer(null);
    setRelatedSuggestions([]);
    setShowQueryForm(false);
    setShowBusinessInquiryForm(false);
  };

  const addUserMessage = (text) => {
    const msg = { id: Date.now(), role: 'user', text, type: 'text', timestamp: new Date() };
    setMessages(prev => [...prev, msg]);
  };

  const addBotMessage = (text, type = 'text', data = null) => {
    const msg = { id: Date.now(), role: 'bot', text, type, data, timestamp: new Date() };
    setMessages(prev => [...prev, msg]);
  };

  const showTypingIndicator = () => setIsTyping(true);
  const hideTypingIndicator = () => setIsTyping(false);

  const startNewConversation = () => {
    setMessages([]);
    setChatEnded(false);
    try {
      getStorage(userId).removeItem(getMsgKey(userId));
      getStorage(userId).removeItem(getEndedKey(userId));
    } catch { /* silent */ }
    clearSearch();
  };

  const endChat = () => setChatEnded(true);

  const detectIntent = async (query) => {
    try {
      const r = await api.post('/api/chatbot/detect-intent', { query });
      return r.data.intent;
    } catch { return { intent: 'unknown', confidence: 'low' }; }
  };

  const getRelatedSuggestions = async (query) => {
    try {
      const r = await api.get('/api/chatbot/related-suggestions', { params: { query, limit: 5 } });
      return r.data.suggestions || [];
    } catch { return []; }
  };

  const submitQuery = async (email, query) => {
    try {
      const r = await api.post('/api/chatbot/submit-query', { email, query });
      message.success('Query submitted successfully');
      return r.data;
    } catch (error) {
      message.error('Failed to submit query');
      throw error;
    }
  };

  const handleCategoryClick = async (category) => {
    if (category === 'Other') {
      addBotMessage('Please provide your detailed query below:', 'text');
      setShowQueryForm(true);
      return;
    }

    addUserMessage(category);
    showTypingIndicator();

    try {
      const contentTypeMap = {
        'articles': 'article', 'blogs': 'blog', 'news': 'news',
        'whitepapers': 'whitepaper', 'reports': 'report',
        'webinars': 'webinar', 'events': 'event', 'resources': 'resource',
      };
      const mappedType = contentTypeMap[category.toLowerCase()];
      let results = [];

      if (mappedType) {
        const response = await api.post('/api/chatbot/search', {
          query: mappedType, searchType: 'content_type', sessionId, limit: 10
        });
        results = response.data.results || [];
        if (results.length === 0) {
          const fallback = await api.post('/api/chatbot/search', {
            query: mappedType, searchType: 'keyword', sessionId, limit: 10
          });
          results = fallback.data.results || [];
        }
      } else {
        const categoriesResponse = await api.get('/api/chatbot/categories');
        const allCategories = categoriesResponse.data.categories || [];
        const matchedCategory = allCategories.find(cat =>
          cat.name.toLowerCase() === category.toLowerCase()
        );
        if (matchedCategory) {
          const response = await api.post('/api/chatbot/search', {
            query: category, searchType: 'keyword', categoryId: matchedCategory.id, sessionId, limit: 10
          });
          results = response.data.results || [];
        } else {
          const response = await api.post('/api/chatbot/search', {
            query: category, searchType: 'keyword', sessionId, limit: 10
          });
          results = response.data.results || [];
        }
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      hideTypingIndicator();

      if (results.length > 0) {
        addBotMessage(`Found ${results.length} results for "${category}"`, 'content_cards', { results });
        setSearchResults(results);
      } else {
        addBotMessage(`No content found for "${category}". Try searching for a specific topic.`, 'text');
      }
    } catch (error) {
      hideTypingIndicator();
      addBotMessage('Failed to load content. Please try again.', 'text');
    }
  };

  const handleSearchWithIntent = async (searchQuery) => {
    const q = searchQuery.trim();
    if (!q || chatEnded) return;

    addUserMessage(q);
    setIsSearching(true);
    setSearchResults([]);
    setSearchedQuery('');
    setCurrentIntent(null);
    setKnowledgeBaseAnswer(null);
    setRelatedSuggestions([]);
    setShowQueryForm(false);
    setShowBusinessInquiryForm(false);

    try {
      const intentResult = await detectIntent(q);
      setCurrentIntent(intentResult);

      showTypingIndicator();
      await new Promise(resolve => setTimeout(resolve, 800));
      hideTypingIndicator();

      if (intentResult.intent === 'greeting') {
        addBotMessage('Hello! 👋\n\nWelcome to our Content Discovery Assistant.\n\nWhat would you like to explore today?', 'category_cards', {
          categories: ['Articles', 'News', 'Blogs', 'Whitepapers', 'Reports', 'Webinars', 'Events', 'Resources', 'Other'],
          onCategoryClick: handleCategoryClick
        });
        setSearchedQuery(q);
        setIsSearching(false);
        return;
      }

      if (intentResult.intent === 'business_inquiry') {
        addBotMessage('I can help you with business inquiries. Please provide your details below.', 'text');
        setShowBusinessInquiryForm(true);
        setSearchedQuery(q);
        setIsSearching(false);
        return;
      }

      const contentTypeMap = {
        'articles': 'article', 'article': 'article',
        'blogs': 'blog', 'blog': 'blog', 'news': 'news',
        'whitepapers': 'whitepaper', 'whitepaper': 'whitepaper',
        'ebooks': 'ebook', 'ebook': 'ebook',
        'reports': 'report', 'report': 'report',
        'webinars': 'webinar', 'webinar': 'webinar',
        'events': 'event', 'event': 'event',
        'resources': 'resource', 'resource': 'resource',
        'interviews': 'interview', 'interview': 'interview',
        'case studies': 'case-study', 'case-study': 'case-study',
      };
      const mappedContentType = contentTypeMap[q.toLowerCase().trim()];
      let dbResults = [];

      if (mappedContentType) {
        const r = await api.post('/api/chatbot/search', {
          query: mappedContentType, searchType: 'content_type', sessionId, limit: 10
        });
        dbResults = r.data.results || [];
      }

      if (dbResults.length === 0) {
        const r = await api.post('/api/chatbot/search', {
          query: q, searchType: 'keyword', sessionId, limit: 10
        });
        dbResults = r.data.results || [];
      }

      if (dbResults.length > 0) {
        addBotMessage(`Found ${dbResults.length} results for "${q}"`, 'content_cards', { results: dbResults });
        setSearchResults(dbResults);
        setSearchedQuery(q);
        saveRecentSearch(q);
        setIsSearching(false);
        api.post('/api/chatbot/message', {
          sessionId, messageType: 'user', message: q,
          metadata: { intent: intentResult.intent, resultsCount: dbResults.length }
        }).catch(() => {});
        return;
      }

      if (intentResult.intent === 'website_question' && intentResult.answer) {
        addBotMessage(intentResult.answer.content, 'page_info', {
          title: intentResult.answer.title,
          summary: intentResult.answer.content,
          link: intentResult.answer.link
        });
        setSearchedQuery(q);
        saveRecentSearch(q);
        setIsSearching(false);
        return;
      }

      const trendingTopics = trending.map(t => t.title || t.category || t.name || '').filter(Boolean).slice(0, 5);
      const suggestions = await getRelatedSuggestions(q);
      const allSuggestions = [...new Set([...trendingTopics, ...suggestions])]
        .filter(s => typeof s === 'string' && s.trim()).slice(0, 8);

      addBotMessage(`Sorry, no content found for "${q}".`, 'text');
      if (allSuggestions.length > 0) {
        addBotMessage('You might be interested in:', 'category_cards', {
          categories: allSuggestions,
          onCategoryClick: (suggestion) => handleSearchWithIntent(suggestion)
        });
      }
      setShowQueryForm(true);
      setRelatedSuggestions(allSuggestions);
      setSearchedQuery(q);
      setIsSearching(false);
      api.post('/api/chatbot/message', {
        sessionId, messageType: 'user', message: q,
        metadata: { intent: intentResult.intent, resultsCount: 0 }
      }).catch(() => {});

    } catch (error) {
      hideTypingIndicator();
      addBotMessage('Search failed. Please try again.', 'text');
      message.error('Search failed. Please try again.');
      setSearchResults([]);
      setSearchedQuery(q);
      setIsSearching(false);
    }
  };

  const value = {
    isOpen, isMinimized,
    query: searchedQuery,
    searchResults, isSearching,
    categories, trending, recentSearches,
    sessionId,
    currentIntent, knowledgeBaseAnswer, relatedSuggestions,
    showQueryForm, showBusinessInquiryForm,
    messages, isTyping, chatEnded,
    toggleChat: () => { setIsOpen(o => !o); setIsMinimized(false); },
    minimizeChat: () => setIsMinimized(m => !m),
    search, clearSearch, logClick, removeRecentSearch,
    setQuery: setSearchedQuery,
    handleSearchWithIntent, handleCategoryClick,
    detectIntent, getRelatedSuggestions, submitQuery,
    setShowQueryForm,
    addUserMessage, addBotMessage,
    showTypingIndicator, hideTypingIndicator,
    startNewConversation, endChat,
    autocomplete: async (q) => {
      try {
        const r = await api.get('/api/chatbot/autocomplete', { params: { query: q, limit: 5 } });
        return r.data.suggestions || [];
      } catch { return []; }
    },
    getNoResultSuggestions: async (q) => {
      try {
        const r = await api.get('/api/chatbot/suggestions', { params: { query: q, limit: 5 } });
        return r.data.suggestions || [];
      } catch { return []; }
    },
    getRelatedContent: async (contentId) => {
      try {
        const r = await api.get(`/api/chatbot/related/${contentId}`, { params: { limit: 5 } });
        return r.data.relatedContent || [];
      } catch { return []; }
    }
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
