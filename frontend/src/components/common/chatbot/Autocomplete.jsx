import React, { useState, useEffect } from 'react';
import { AutoComplete } from 'antd';
import { useChat } from '../../../context/ChatContext';

const Autocomplete = ({ onSelect }) => {
  const { autocomplete } = useChat();
  const [options, setOptions] = useState([]);
  const [searchText, setSearchText] = useState('');

  const handleSearch = async (value) => {
    setSearchText(value);
    
    if (value.length < 2) {
      setOptions([]);
      return;
    }

    const suggestions = await autocomplete(value);
    
    setOptions(suggestions.map(item => ({
      value: item.title,
      label: (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 0'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--color-heading)'
            }}>
              {item.title}
            </div>
            <div style={{
              fontSize: 11,
              color: 'var(--color-muted)',
              marginTop: 2
            }}>
              {item.category} • {item.content_type}
            </div>
          </div>
        </div>
      ),
      data: item
    })));
  };

  const handleSelect = (value, option) => {
    if (onSelect && option.data) {
      onSelect(option.data);
    }
  };

  return (
    <AutoComplete
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      placeholder="Search for content..."
      style={{ width: '100%' }}
      size="large"
      allowClear
    />
  );
};

export default Autocomplete;
