import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { message } from 'antd';

const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // searchedQuery = the query that was actually submitted (shown in results header)
  const [searchedQuery, setSearchedQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentIntent, setCurrentIntent] = useState(null);
  const [knowledgeBaseAnswer, setKnowledgeBaseAnswer] = useState(null);
  const [relatedSuggestions, setRelatedSuggestions] = useState([]);
  const [showQueryForm, setShowQueryForm] = useState(false);

  const [categories, setCategories] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [sessionId, setSessionId] = useState(null);

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
    setSearchedQuery('');  // clear until results arrive

    try {
      const response = await api.post('/api/chatbot/search', {
        query: q, searchType: 'keyword', sessionId, limit: 10
      });
      const results = response.data.results || [];
      setSearchResults(results);
      setSearchedQuery(q);  // only set AFTER results are ready
      saveRecentSearch(q);

      // fire-and-forget logging
      api.post('/api/chatbot/message', {
        sessionId, messageType: 'user', message: q,
        metadata: { searchType: 'keyword', resultsCount: results.length }
      }).catch(() => {});

    } catch (error) {
      console.error('Search failed:', error);
      message.error('Search failed. Please try again.');
      setSearchResults([]);
      setSearchedQuery(q);  // still show 404 with correct query
    } finally {
      setIsSearching(false);
    }
  };

  const logClick = async (contentId, position = 0) => {
    try {
      await api.post('/api/chatbot/click', {
        sessionId, contentId, searchQuery: searchedQuery,
        searchType: 'keyword', position
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
  };

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

  const handleSearchWithIntent = async (searchQuery) => {
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    setSearchResults([]);
    setSearchedQuery('');
    setCurrentIntent(null);
    setKnowledgeBaseAnswer(null);
    setRelatedSuggestions([]);
    setShowQueryForm(false);

    try {
      // NEW ROUTING PRIORITY: Search database FIRST, then intent detection
      console.log('[ChatContext] Step 1: Searching database for query:', q);
      
      const searchParams = {
        query: q,
        searchType: 'keyword',
        sessionId,
        limit: 10
      };

      const response = await api.post('/api/chatbot/search', searchParams);
      const results = response.data.results || [];
      
      console.log('[ChatContext] Database search results count:', results.length);
      
      // If database has results, return immediately (highest priority)
      if (results.length > 0) {
        console.log('[ChatContext] Found results in database, returning search results');
        setSearchResults(results);
        setSearchedQuery(q);
        saveRecentSearch(q);
        setIsSearching(false);
        
        // fire-and-forget logging
        api.post('/api/chatbot/message', {
          sessionId, messageType: 'user', message: q,
          metadata: { intent: 'content_search', resultsCount: results.length }
        }).catch(() => {});
        return;
      }
      
      // Database has NO results - now run intent detection
      console.log('[ChatContext] Step 2: No database results, running intent detection');
      const intentResult = await detectIntent(q);
      setCurrentIntent(intentResult);
      console.log('[ChatContext] Detected intent:', intentResult.intent);

      // Handle greeting intent
      if (intentResult.intent === 'greeting') {
        setKnowledgeBaseAnswer({
          title: 'Hello!',
          content: 'How can I help you today? You can ask me about Articles, Whitepapers, Reports, Services, Contact, and more.',
          link: null
        });
        setSearchedQuery(q);
        return;
      }

      // Handle business inquiry intent - show query form
      if (intentResult.intent === 'business_inquiry') {
        console.log('[ChatContext] Showing Business Inquiry form - intent: business_inquiry');
        setShowQueryForm(true);
        setSearchedQuery(q);
        return;
      }

      // Handle unknown intent with too_short reason
      if (intentResult.intent === 'unknown' && intentResult.reason) {
        setKnowledgeBaseAnswer({
          title: 'I\'m sorry',
          content: 'I didn\'t understand your request. Please provide more details or ask me about Articles, Whitepapers, Services, Contact, etc.',
          link: null
        });
        setSearchedQuery(q);
        return;
      }

      // If intent is website_question with answer, show it
      if (intentResult.intent === 'website_question' && intentResult.answer) {
        console.log('[ChatContext] Showing knowledge base answer for website question');
        setKnowledgeBaseAnswer(intentResult.answer);
        setSearchedQuery(q);
        saveRecentSearch(q);
        return;
      }

      // No results and no specific intent - show related suggestions
      console.log('[ChatContext] No specific intent, getting related suggestions');
      const suggestions = await getRelatedSuggestions(q);
      console.log('[ChatContext] Related suggestions count:', suggestions.length);
      if (suggestions.length > 0) {
        setRelatedSuggestions(suggestions);
        setSearchedQuery(q);
      } else {
        console.log('[ChatContext] No suggestions, showing Business Inquiry form (fallback)');
        setShowQueryForm(true);
        setSearchedQuery(q);
      }

      // fire-and-forget logging
      api.post('/api/chatbot/message', {
        sessionId, messageType: 'user', message: q,
        metadata: { intent: intentResult.intent, resultsCount: 0 }
      }).catch(() => {});

    } catch (error) {
      console.error('Search failed:', error);
      message.error('Search failed. Please try again.');
      setSearchResults([]);
      setSearchedQuery(q);
    } finally {
      setIsSearching(false);
    }
  };

  const value = {
    isOpen, isMinimized,
    query: searchedQuery,       // keep 'query' name for compatibility
    searchResults, isSearching,
    categories, trending, recentSearches,
    sessionId,
    currentIntent,
    knowledgeBaseAnswer,
    relatedSuggestions,
    showQueryForm,
    toggleChat: () => { setIsOpen(o => !o); setIsMinimized(false); },
    minimizeChat: () => setIsMinimized(m => !m),
    search, clearSearch, logClick, removeRecentSearch,
    setQuery: setSearchedQuery,  // keep for compatibility
    handleSearchWithIntent,
    detectIntent,
    getRelatedSuggestions,
    submitQuery,
    setShowQueryForm,
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
