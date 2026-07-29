import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useChat } from '../../../context/ChatContext';

const SearchInput = () => {
  const { handleSearchWithIntent, isSearching, clearSearch, setQuery, chatEnded } = useChat();
  const [inputValue, setInputValue] = useState('');

  const handleSearch = () => {
    const val = inputValue.trim();
    if (val && !chatEnded) {
      handleSearchWithIntent(val);
      setInputValue(''); // Clear input after sending
    }
  };

  const handleClear = () => {
    setInputValue('');
    setQuery('');
    clearSearch();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        border: '1px solid var(--color-border)',
        borderRadius: 24,
        overflow: 'hidden',
        background: 'var(--color-bg-alt)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          disabled={isSearching || chatEnded}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '12px 16px',
            fontSize: 14,
            background: 'transparent',
            color: 'var(--color-body)'
          }}
        />
        {inputValue && !chatEnded && (
          <button onClick={handleClear} style={{
            border: 'none', background: 'none', cursor: 'pointer',
            padding: '0 8px', color: 'var(--color-muted)', display: 'flex', alignItems: 'center'
          }}>
            <X size={16} />
          </button>
        )}
        <button
          onClick={handleSearch}
          disabled={isSearching || !inputValue.trim() || chatEnded}
          style={{
            border: 'none',
            background: isSearching || !inputValue.trim() || chatEnded 
              ? 'var(--color-disabled)' 
              : 'linear-gradient(135deg, #0B1F4D 0%, #123A8C 100%)',
            cursor: isSearching || !inputValue.trim() || chatEnded ? 'not-allowed' : 'pointer',
            padding: '10px 20px',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 0
          }}
        >
          {isSearching ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default SearchInput;
