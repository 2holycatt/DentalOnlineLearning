import React, { useState } from 'react';

const ImageComponent = (props) => {
  const [imageUrl, setImageUrl] = useState('');

  const handleChange = (event) => {
    setImageUrl(event.target.value);
  };

  return (
    <div className="image-component">
      <input type="text" value={imageUrl} onChange={handleChange} placeholder="ป้อน URL รูปภาพ" />
      {imageUrl && <img src={imageUrl} alt="รูปภาพ" />}
    </div>
  );
};

export default ImageComponent;