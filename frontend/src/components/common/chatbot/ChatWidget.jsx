import React from 'react';
import { Button, Badge } from 'antd';
import { MessageCircle, X } from 'lucide-react';
import { useChat } from '../../../context/ChatContext';
import ChatWindow from './ChatWindow';

const ChatWidget = () => {
  const { isOpen, toggleChat, isMinimized } = useChat();

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          type="primary"
          icon={<MessageCircle size={24} />}
          onClick={toggleChat}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            background: 'linear-gradient(135deg, #0B1F4D 0%, #123A8C 100%)',
            border: 'none',
            boxShadow: '0 4px 16px rgba(11,31,77,0.3)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(11,31,77,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(11,31,77,0.3)';
          }}
        >
          <span style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#F7941D',
            border: '2px solid #fff'
          }} />
        </Button>
      )}

      {/* Minimized Button */}
      {isMinimized && (
        <Button
          type="primary"
          icon={<MessageCircle size={20} />}
          onClick={toggleChat}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #0B1F4D 0%, #123A8C 100%)',
            border: 'none',
            boxShadow: '0 4px 16px rgba(11,31,77,0.3)',
            zIndex: 999,
            height: 48,
            paddingLeft: 16,
            paddingRight: 20,
            fontWeight: 500
          }}
        >
          Content Discovery
        </Button>
      )}

      {/* Chat Window */}
      <ChatWindow />
    </>
  );
};

export default ChatWidget;
