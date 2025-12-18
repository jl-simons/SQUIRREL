import React from 'react';
import Home from './Home';

/**
 * Inventory Component
 * 
 * Wrapper for the Home component to maintain backward compatibility.
 * This component will be used for the Inventory tab.
 */
const Inventory = () => {
  return (
    <div className="inventory-container">
      <h1>Inventory</h1>
      <Home />
    </div>
  );
};

export default Inventory;