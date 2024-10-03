import React, { useState } from 'react';

const TextComponent = () => {
  const [inputText, setInputText] = useState('');

  const handleChange = (event) => {
    setInputText(event.target.value);
  };

  return (
    <div className="text-component">
      <input type="text" value={inputText} onChange={handleChange} />
      <div className="text-display">{inputText}</div>
    </div>
  );
};

export default TextComponent;