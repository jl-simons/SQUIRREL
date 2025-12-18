/**
 * Tests for Notification Utilities
 */

import { 
  NOTIFICATION_TYPES, 
  LOW_STOCK_THRESHOLD,
  createNotification, 
  addNotification, 
  removeNotification,
  hasItemBeenNotified,
  markItemAsNotified,
  getNotifiedLowStockItems,
  setNotifiedLowStockItems,
  createLowStockNotification,
  areBrowserNotificationsAvailable,
  requestNotificationPermission,
  showBrowserNotification
} from '../utils/notificationUtils';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock browser notifications
global.Notification = jest.fn(() => ({
  close: jest.fn()
}));
Notification.permission = 'granted';
Notification.requestPermission = jest.fn(() => Promise.resolve('granted'));

describe('Notification Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('NOTIFICATION_TYPES', () => {
    test('should define all required notification types', () => {
      expect(NOTIFICATION_TYPES).toHaveProperty('SUCCESS');
      expect(NOTIFICATION_TYPES).toHaveProperty('ERROR');
      expect(NOTIFICATION_TYPES).toHaveProperty('WARNING');
      expect(NOTIFICATION_TYPES).toHaveProperty('INFO');
      expect(NOTIFICATION_TYPES).toHaveProperty('LOW_STOCK');
    });
  });

  describe('LOW_STOCK_THRESHOLD', () => {
    test('should be defined and be a number', () => {
      expect(LOW_STOCK_THRESHOLD).toBeDefined();
      expect(typeof LOW_STOCK_THRESHOLD).toBe('number');
    });
  });

  describe('createNotification', () => {
    test('should create a notification object with default values', () => {
      // Arrange
      const message = 'Test notification';

      // Act
      const notification = createNotification(message);

      // Assert
      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('message', message);
      expect(notification).toHaveProperty('type', NOTIFICATION_TYPES.INFO);
      expect(notification).toHaveProperty('duration', 3000);
      expect(notification).toHaveProperty('timestamp');
      expect(notification).toHaveProperty('metadata', {});
    });

    test('should create a notification with custom type, duration, and metadata', () => {
      // Arrange
      const message = 'Error notification';
      const type = NOTIFICATION_TYPES.ERROR;
      const duration = 5000;
      const metadata = { itemId: '123' };

      // Act
      const notification = createNotification(message, type, duration, metadata);

      // Assert
      expect(notification).toHaveProperty('type', type);
      expect(notification).toHaveProperty('duration', duration);
      expect(notification).toHaveProperty('metadata', metadata);
    });
  });

  describe('addNotification', () => {
    test('should add a notification to the list', () => {
      // Arrange
      const currentNotifications = [];
      const newNotification = createNotification('New notification');

      // Act
      const result = addNotification(currentNotifications, newNotification);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(newNotification);
    });

    test('should not add duplicate notifications with the same message and type', () => {
      // Arrange
      const notification = createNotification('Test notification', NOTIFICATION_TYPES.INFO);
      const currentNotifications = [notification];
      const duplicateNotification = createNotification('Test notification', NOTIFICATION_TYPES.INFO);

      // Act
      const result = addNotification(currentNotifications, duplicateNotification);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(notification);
    });
  });

  describe('removeNotification', () => {
    test('should remove a notification from the list by id', () => {
      // Arrange
      const notification1 = { id: 1, message: 'First notification' };
      const notification2 = { id: 2, message: 'Second notification' };
      const notifications = [notification1, notification2];

      // Act
      const result = removeNotification(notifications, 1);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(notification2);
    });

    test('should return the same list if notification id is not found', () => {
      // Arrange
      const notifications = [{ id: 1, message: 'Test notification' }];

      // Act
      const result = removeNotification(notifications, 999);

      // Assert
      expect(result).toHaveLength(1);
    });
  });

  describe('Low stock notification tracking', () => {
    test('should track notified items in localStorage', () => {
      // Arrange
      const itemId = '123';

      // Act
      markItemAsNotified(itemId);

      // Assert
      expect(localStorage.setItem).toHaveBeenCalled();
      expect(getNotifiedLowStockItems()).toContain(itemId);
    });

    test('should not add duplicate item IDs to notified items', () => {
      // Arrange
      const itemId = '123';
      setNotifiedLowStockItems([itemId]);

      // Act
      markItemAsNotified(itemId);

      // Assert
      expect(getNotifiedLowStockItems()).toEqual([itemId]);
    });

    test('should correctly check if an item has been notified', () => {
      // Arrange
      const itemId = '123';
      setNotifiedLowStockItems([itemId]);

      // Act & Assert
      expect(hasItemBeenNotified(itemId)).toBe(true);
      expect(hasItemBeenNotified('456')).toBe(false);
    });
  });

  describe('createLowStockNotification', () => {
    test('should create a low stock notification for an item', () => {
      // Arrange
      const item = { id: '123', name: 'Test Item', quantity: 1 };
      const setNotifications = jest.fn();

      // Act
      const result = createLowStockNotification(item, setNotifications);

      // Assert
      expect(result).toBe(true);
      expect(setNotifications).toHaveBeenCalled();
      expect(hasItemBeenNotified(item.id)).toBe(true);
      expect(global.Notification).toHaveBeenCalled();
    });

    test('should not create a notification for an item that has already been notified', () => {
      // Arrange
      const item = { id: '123', name: 'Test Item', quantity: 1 };
      markItemAsNotified(item.id);
      const setNotifications = jest.fn();

      // Act
      const result = createLowStockNotification(item, setNotifications);

      // Assert
      expect(result).toBe(false);
      expect(setNotifications).not.toHaveBeenCalled();
      expect(global.Notification).not.toHaveBeenCalled();
    });
  });

  describe('areBrowserNotificationsAvailable', () => {
    test('should return true when Notification is available and permission is granted', () => {
      // Arrange
      global.Notification = jest.fn();
      Notification.permission = 'granted';

      // Act
      const result = areBrowserNotificationsAvailable();

      // Assert
      expect(result).toBe(true);
    });

    test('should return false when Notification is available but permission is not granted', () => {
      // Arrange
      global.Notification = jest.fn();
      Notification.permission = 'denied';

      // Act
      const result = areBrowserNotificationsAvailable();

      // Assert
      expect(result).toBe(false);
    });

    test('should return false when Notification is not available', () => {
      // Arrange
      const originalNotification = global.Notification;
      delete global.Notification;

      // Act
      const result = areBrowserNotificationsAvailable();

      // Assert
      expect(result).toBe(false);

      // Cleanup
      global.Notification = originalNotification;
    });
  });

  describe('requestNotificationPermission', () => {
    test('should request permission when Notification is available and not denied', async () => {
      // Arrange
      global.Notification = jest.fn();
      Notification.permission = 'default';
      Notification.requestPermission = jest.fn(() => Promise.resolve('granted'));

      // Act
      const result = await requestNotificationPermission();

      // Assert
      expect(Notification.requestPermission).toHaveBeenCalled();
      expect(result).toBe('granted');
    });

    test('should return current permission when already denied', async () => {
      // Arrange
      global.Notification = jest.fn();
      Notification.permission = 'denied';
      Notification.requestPermission = jest.fn();

      // Act
      const result = await requestNotificationPermission();

      // Assert
      expect(Notification.requestPermission).not.toHaveBeenCalled();
      expect(result).toBe('denied');
    });

    test('should return denied when Notification is not available', async () => {
      // Arrange
      const originalNotification = global.Notification;
      delete global.Notification;

      // Act
      const result = await requestNotificationPermission();

      // Assert
      expect(result).toBe('denied');

      // Cleanup
      global.Notification = originalNotification;
    });
  });

  describe('showBrowserNotification', () => {
    test('should create a notification when browser notifications are available', () => {
      // Arrange
      global.Notification = jest.fn();
      Notification.permission = 'granted';
      const title = 'Test Notification';
      const options = { body: 'Test body' };

      // Act
      showBrowserNotification(title, options);

      // Assert
      expect(global.Notification).toHaveBeenCalledWith(title, options);
    });

    test('should not create a notification when browser notifications are not available', () => {
      // Arrange
      global.Notification = jest.fn();
      Notification.permission = 'denied';
      const title = 'Test Notification';
      const options = { body: 'Test body' };

      // Act
      showBrowserNotification(title, options);

      // Assert
      expect(global.Notification).not.toHaveBeenCalled();
    });
  });
});
