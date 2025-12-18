import React from 'react';

/**
 * Rewards Page (temporary iframe integration)
 */
const Rewards = () => {
  return (
    <div className="rewards-container">
      <h1>Rewards</h1>
      <div className="iframe-container">
        <iframe
          src="/backend/rewards?embed=1"
          title="Rewards"
          width="100%"
          height="800px"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
};

export default Rewards;
