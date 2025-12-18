/**
 * Notification Utilities
 * 
 * Provides functions for creating, managing, and displaying notifications.
 * Supports different types of notifications (success, error, warning, info).
 * Includes support for low stock notifications and browser notifications.
 */

// Storage key for tracking which items have already triggered low stock notifications
const LOW_STOCK_NOTIFIED_KEY = 'low_stock_notified_items';

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOW_STOCK: 'low-stock' // New type for low stock notifications
};

/**
 * Low stock threshold - items with quantity below this value will trigger notifications
 * This value can be adjusted to change when low stock notifications are triggered
 * Note: This should match the threshold in InventoryTable.jsx
 */
export const LOW_STOCK_THRESHOLD = 2;

/**
 * Creates a new notification object
 * @param {string} message - The notification message
 * @param {string} type - The notification type (from NOTIFICATION_TYPES)
 * @param {number} duration - How long the notification should display (in ms)
 * @param {Object} metadata - Additional data to include with the notification
 * @returns {Object} Notification object
 */
export const createNotification = (message, type = NOTIFICATION_TYPES.INFO, duration = 3000, metadata = {}) => {
  return {
    id: Date.now(),
    message,
    type,
    duration,
    timestamp: new Date(),
    metadata
  };
};

/**
 * Manages notification queue and lifecycle
 * @param {Array} currentNotifications - Current list of active notifications
 * @param {Object} newNotification - New notification to add
 * @returns {Array} Updated list of notifications
 */
export const addNotification = (currentNotifications = [], newNotification) => {
  // Prevent duplicate notifications with the same message and type
  const isDuplicate = currentNotifications.some(
    notification => 
      notification.message === newNotification.message && 
      notification.type === newNotification.type
  );

  if (isDuplicate) {
    return currentNotifications;
  }

  return [...currentNotifications, newNotification];
};

/**
 * Removes a notification from the list
 * @param {Array} notifications - Current list of notifications
 * @param {string|number} notificationId - ID of notification to remove
 * @returns {Array} Updated list of notifications
 */
export const removeNotification = (notifications = [], notificationId) => {
  return notifications.filter(notification => notification.id !== notificationId);
};

/**
 * Checks if browser notifications are supported and enabled
 * @returns {boolean} True if browser notifications are supported and permission is granted
 */
export const areBrowserNotificationsAvailable = () => {
  return 'Notification' in window && Notification.permission === 'granted';
};

/**
 * Requests permission for browser notifications
 * @returns {Promise} Promise that resolves with the permission result
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
};

/**
 * Shows a browser notification
 * @param {string} title - The notification title
 * @param {Object} options - Notification options (body, icon, etc.)
 */
export const showBrowserNotification = (title, options = {}) => {
  if (areBrowserNotificationsAvailable()) {
    new Notification(title, options);
  }
};

/**
 * Gets the list of item IDs that have already triggered low stock notifications
 * @returns {Array} Array of item IDs
 */
export const getNotifiedLowStockItems = () => {
  const data = localStorage.getItem(LOW_STOCK_NOTIFIED_KEY);
  return data ? JSON.parse(data) : [];
};

/**
 * Saves the list of item IDs that have triggered low stock notifications
 * @param {Array} itemIds - Array of item IDs
 */
export const setNotifiedLowStockItems = (itemIds) => {
  localStorage.setItem(LOW_STOCK_NOTIFIED_KEY, JSON.stringify(itemIds));
};

/**
 * Marks an item as having triggered a low stock notification
 * @param {string} itemId - ID of the item
 */
export const markItemAsNotified = (itemId) => {
  const notifiedItems = getNotifiedLowStockItems();
  if (!notifiedItems.includes(itemId)) {
    setNotifiedLowStockItems([...notifiedItems, itemId]);
  }
};

/**
 * Checks if an item has already triggered a low stock notification
 * @param {string} itemId - ID of the item
 * @returns {boolean} True if the item has already triggered a notification
 */
export const hasItemBeenNotified = (itemId) => {
  return getNotifiedLowStockItems().includes(itemId);
};

/**
 * Creates a low stock notification for an item
 * @param {Object} item - The inventory item
 * @param {Function} setNotifications - Function to update notifications state
 * @returns {boolean} True if a notification was created
 */
export const createLowStockNotification = (item, setNotifications) => {
  // Skip if item has already been notified
  if (hasItemBeenNotified(item.id)) {
    return false;
  }

  // Create notification message
  const message = `Low stock alert: ${item.name} (${item.quantity} remaining)`;

  // Create in-app notification
  const notification = createNotification(
    message,
    NOTIFICATION_TYPES.LOW_STOCK,
    5000,
    { itemId: item.id }
  );

  // Update notifications state
  setNotifications(current => addNotification(current, notification));

  // Show browser notification if available
  showBrowserNotification('SQUIRREL - Low Stock Alert', {
    body: message,
    icon: '/src/assets/logo.png'
  });

  // Mark item as notified
  markItemAsNotified(item.id);

  return true;
};
