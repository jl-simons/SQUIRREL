import React, { useState, useEffect } from 'react';
import InventoryTable from '../components/InventoryTable';
import ItemForm from '../components/ItemForm';
import SearchBar from '../components/SearchBar';
import NotificationBar from '../components/NotificationBar';
import { getInventory, addItem, updateItem, deleteItem } from '../utils/inventoryStorage';
import { 
  createLowStockNotification, 
  removeNotification, 
  createNotification,
  NOTIFICATION_TYPES,
  LOW_STOCK_THRESHOLD 
} from '../utils/notificationUtils';
import { initializeWithSampleData } from '../utils/sampleData';

/**
 * Home Page Component
 * 
 * Main page of the application that displays the inventory table,
 * search functionality, and item form for adding/editing items.
 * Checks for low stock items and triggers notifications.
 */
const Home = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Load inventory items on component mount
  useEffect(() => {
    const loadInventory = () => {
      const inventoryItems = getInventory();
      setItems(inventoryItems);
      setFilteredItems(inventoryItems);
    };

    loadInventory();

    // Set up interval to periodically check inventory
    const intervalId = setInterval(loadInventory, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, []);

  // Check for low stock items and trigger notifications
  useEffect(() => {
    items.forEach(item => {
      if (item.quantity !== undefined && item.quantity <= LOW_STOCK_THRESHOLD) {
        createLowStockNotification(item, setNotifications);
      }
    });
  }, [items]);

  // Handle item form submission (add or edit)
  const handleItemSubmit = (item) => {
    if (editingItem) {
      // Update existing item
      updateItem(item.id, item);
      setNotifications(prev => [...prev, createNotification(`Item "${item.name}" updated successfully`, NOTIFICATION_TYPES.SUCCESS)]);
    } else {
      // Add new item
      addItem(item);
      setNotifications(prev => [...prev, createNotification(`Item "${item.name}" added successfully`, NOTIFICATION_TYPES.SUCCESS)]);
    }

    // Refresh inventory
    setItems(getInventory());
    setFilteredItems(getInventory());

    // Reset form state
    setEditingItem(null);
    setShowForm(false);
  };

  // Handle item edit
  const handleItemEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  // Handle item delete
  const handleItemDelete = (id) => {
    const itemToDelete = items.find(item => item.id === id);
    if (itemToDelete) {
      deleteItem(id);
      setNotifications(prev => [...prev, createNotification(`Item "${itemToDelete.name}" deleted successfully`, NOTIFICATION_TYPES.SUCCESS)]);

      // Refresh inventory
      setItems(getInventory());
      setFilteredItems(getInventory());
    }
  };

  // Handle search input change
  const handleSearchChange = (searchTerm) => {
    if (!searchTerm) {
      setFilteredItems(items);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = items.filter(item => 
      item.name.toLowerCase().includes(term) || 
      (item.location && item.location.toLowerCase().includes(term))
    );

    setFilteredItems(filtered);
  };

  // Handle notification removal
  const handleRemoveNotification = (id) => {
    setNotifications(current => removeNotification(current, id));
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setEditingItem(null);
    setShowForm(false);
  };

  return (
    <div className="home-page">
      <h1>SQUIRREL Home Inventory</h1>

      {/* Display notifications */}
      {notifications.length > 0 && notifications.map(notification => (
        <NotificationBar 
          key={notification.id}
          message={notification.message} 
          type={notification.type}
          duration={notification.duration}
          onClose={() => handleRemoveNotification(notification.id)} 
        />
      ))}

      <div className="home-content">
        {/* Search bar */}
        <div className="search-section">
          <SearchBar 
            value="" 
            onChange={handleSearchChange} 
          />
          <button 
            className="add-item-button" 
            onClick={() => setShowForm(true)}
          >
            Add New Item
          </button>
        </div>

        {/* Item form (conditionally rendered) */}
        {showForm && (
          <div className="form-container">
            <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
            <ItemForm 
              initialItem={editingItem} 
              onSubmit={handleItemSubmit} 
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {/* Inventory table */}
        <div className="inventory-section">
          <InventoryTable 
            items={filteredItems} 
            onEdit={handleItemEdit} 
            onDelete={handleItemDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
