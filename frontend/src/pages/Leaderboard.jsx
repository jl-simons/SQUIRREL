import React from 'react';

/**
 * Leaderboard Page (temporary iframe integration)
 */
const Leaderboard = () => {
  return (
    <div className="leaderboard-container">
      <h1>Leaderboard</h1>
      <div className="iframe-container">
        <iframe
          src="/backend/leaderboard?embed=1"
          title="Leaderboard"
          width="100%"
          height="800px"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
};

export default Leaderboard;
