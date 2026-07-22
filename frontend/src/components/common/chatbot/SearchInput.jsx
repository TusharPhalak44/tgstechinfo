import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useChat } from '../../../context/ChatContext';

const SUGGESTIONS = ['AI Hiring', 'Cybersecurity', 'Cloud Computing', 'DevOps'];

const SearchInput = () => {
  const { handleSearchWithIntent, isSearching, clearSearch, setQuery } = useChat();
  const [inputValue, setInputValue] = useState('');

  const handleSearch = () => {
    const val = inputValue.trim();
    if (val) handleSearchWithIntent(val);
  };

  const handleClear = () => {
    setInputValue('');
    setQuery('');
    clearSearch();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSuggestion = (s) => {
    setInputValue(s);
    handleSearchWithIntent(s);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #d9d9d9',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for articles, whitepapers, reports..."
          disabled={isSearching}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '10px 14px',
            fontSize: 14,
            background: 'transparent',
            color: 'var(--color-body)'
          }}
        />
        {inputValue && (
          <button onClick={handleClear} style={{
            border: 'none', background: 'none', cursor: 'pointer',
            padding: '0 8px', color: '#999', display: 'flex', alignItems: 'center'
          }}>
            <X size={16} />
          </button>
        )}
        <button
          onClick={handleSearch}
          disabled={isSearching || !inputValue.trim()}
          style={{
            border: 'none',
            background: isSearching ? '#ccc' : 'linear-gradient(135deg, #F7941D 0%, #E67E00 100%)',
            cursor: isSearching || !inputValue.trim() ? 'not-allowed' : 'pointer',
            padding: '10px 16px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isSearching
            ? <span style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
            : <Search size={18} />}
        </button>
      </div>

      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>Try:</span>
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => handleSuggestion(s)} style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 12,
            border: '1px solid var(--color-border)', background: 'var(--color-bg-alt)',
            color: 'var(--color-body)', cursor: 'pointer', transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-body)'; }}
          >{s}</button>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SearchInput;
