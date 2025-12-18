import React from 'react';

/**
 * Chores Component
 * 
 * Displays the chores page from the Flask app in an iframe.
 * This is a temporary solution until the chores functionality is fully integrated into the React app.
 */
const Chores = () => {
  return (
    <div className="chores-container">
      <h1>Chores</h1>
      <div className="iframe-container">
        <iframe 
          src="/backend/chores?embed=1" 
          title="Chores"
          width="100%"
          height="800px"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
};

export default Chores;