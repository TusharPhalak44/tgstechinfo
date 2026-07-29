import React, { useRef, useEffect } from 'react';
import { Button } from 'antd';
import { Minimize2, X } from 'lucide-react';
import { useChat } from '../../../context/ChatContext';
import SearchInput from './SearchInput';
import SearchResults from './SearchResults';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import QuerySubmissionForm from './QuerySubmissionForm';
import BusinessInquiryForm from './BusinessInquiryForm';

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
    showQueryForm,
    showBusinessInquiryForm,
    messages,
    isTyping,
    chatEnded,
    startNewConversation
  } = useChat();

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [isOpen]);

  if (!isOpen || isMinimized) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .chat-message {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
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
        background: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Conversation Messages */}
        {messages.length === 0 && !isSearching && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            textAlign: 'center'
          }}>
            <style>{`
              @keyframes welcomePulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.04); opacity: 0.85; }
              }
              @keyframes fadeSlideUp {
                from { opacity: 0; transform: translateY(16px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes shimmer {
                0% { background-position: -200% center; }
                100% { background-position: 200% center; }
              }
            `}</style>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #0B1F4D 0%, #123A8C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              boxShadow: '0 8px 24px rgba(11,31,77,0.25)',
              animation: 'welcomePulse 2.5s ease-in-out infinite'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <h3 style={{
              fontSize: 26,
              fontWeight: 800,
              margin: '0 0 10px 0',
              background: 'linear-gradient(90deg, #0B1F4D, #F7941D, #123A8C, #0AAEEF)',
              backgroundSize: '300% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 3s linear infinite, fadeSlideUp 0.6s ease both',
              letterSpacing: '-0.5px'
            }}>
              Welcome to TGS
            </h3>
            <p style={{
              fontSize: 14,
              color: 'var(--color-muted)',
              margin: 0,
              lineHeight: 1.6,
              animation: 'fadeSlideUp 0.6s ease 0.2s both'
            }}>
              How may I help you?
            </p>
          </div>
        )}

        {messages.map((message, idx) => (
          <ChatMessage key={idx} message={message} />
        ))}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}

        {/* Query Submission Form */}
        {showQueryForm && <QuerySubmissionForm />}

        {/* Business Inquiry Form */}
        {showBusinessInquiryForm && <BusinessInquiryForm />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Ended State */}
      {chatEnded && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          background: 'var(--color-bg-alt)',
          borderTop: '1px solid var(--color-border)'
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-heading)',
            marginBottom: 8
          }}>
            Conversation Ended
          </div>
          <div style={{
            fontSize: 12,
            color: 'var(--color-muted)',
            marginBottom: 16
          }}>
            Thank you for using our Content Discovery Assistant
          </div>
          <button
            onClick={startNewConversation}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Start New Conversation
          </button>
        </div>
      )}

      {/* Search Input */}
      {!chatEnded && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          borderRadius: '0 0 16px 16px'
        }}>
          <SearchInput />
        </div>
      )}
    </div>
    </>
  );
};

export default ChatWindow;
