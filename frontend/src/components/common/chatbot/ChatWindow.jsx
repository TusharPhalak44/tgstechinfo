import React from 'react';
import { Button } from 'antd';
import { Minimize2, X } from 'lucide-react';
import { useChat } from '../../../context/ChatContext';
import SearchInput from './SearchInput';
import SearchResults from './SearchResults';
import ChatbotWelcome from './ChatbotWelcome';
import KnowledgeBaseAnswer from './KnowledgeBaseAnswer';
import RelatedSuggestions from './RelatedSuggestions';
import QuerySubmissionForm from './QuerySubmissionForm';
import TypingIndicator from './TypingIndicator';

const ChatWindow = () => {
  const { 
    isMinimized, 
    minimizeChat, 
    query, 
    searchResults, 
    isSearching, 
    isOpen,
    knowledgeBaseAnswer,
    relatedSuggestions,
    showQueryForm
  } = useChat();

  if (!isOpen || isMinimized) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      right: 20,
      width: 400,
      maxWidth: 'calc(100vw - 40px)',
      height: 600,
      maxHeight: 'calc(100vh - 120px)',
      background: 'var(--color-surface)',
      borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      border: '1px solid var(--color-border)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #0B1F4D 0%, #123A8C 100%)',
        borderRadius: '16px 16px 0 0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #F7941D 0%, #E67E00 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <div>
            <h3 style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              margin: 0,
              lineHeight: 1.2
            }}>
              Content Discovery
            </h3>
            <span style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.8)'
            }}>
              Find articles, whitepapers, reports
            </span>
          </div>
        </div>
        <div style={{
          display: 'flex',
          gap: 4
        }}>
          <Button
            type="text"
            icon={<Minimize2 size={18} />}
            onClick={minimizeChat}
            style={{
              color: 'rgba(255,255,255,0.8)',
              border: 'none',
              padding: 4
            }}
          />
          <Button
            type="text"
            icon={<X size={18} />}
            onClick={minimizeChat}
            style={{
              color: 'rgba(255,255,255,0.8)',
              border: 'none',
              padding: 4
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px 20px',
        background: 'var(--color-surface)'
      }}>
        {/* Welcome State */}
        {!query && !isSearching && <ChatbotWelcome />}

        {/* Knowledge Base Answer */}
        {!isSearching && query && knowledgeBaseAnswer && (
          <KnowledgeBaseAnswer answer={knowledgeBaseAnswer} />
        )}

        {/* Search Results */}
        {!isSearching && query && searchResults.length > 0 && (
          <SearchResults query={query} />
        )}

        {/* Related Suggestions */}
        {!isSearching && query && relatedSuggestions.length > 0 && (
          <RelatedSuggestions suggestions={relatedSuggestions} />
        )}

        {/* Query Submission Form */}
        {!isSearching && query && showQueryForm && (
          <QuerySubmissionForm />
        )}

        {/* Typing Indicator */}
        {isSearching && <TypingIndicator />}
      </div>

      {/* Search Input */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        borderRadius: '0 0 16px 16px'
      }}>
        <SearchInput />
      </div>
    </div>
  );
};

export default ChatWindow;
