// src/tests/notificationManager.test.js

import { createBrowserNotificationManager } from '../utils/notificationManager';

describe('NotificationManager', () => {
  let notificationManager;
  
  beforeEach(() => {
    // Reset the Notification mock
    Notification.mockClear();
    notificationManager = createBrowserNotificationManager();
  });

  describe('notifyLowStock', () => {
    test('should create a notification with correct title and message', async () => {
      const item = { id: '1', name: 'Test Item' };
      const message = 'Only 2 left in stock';
      
      await notificationManager.notifyLowStock(item, message);
      
      expect(Notification).toHaveBeenCalledWith(
        'Low Stock: Test Item',
        expect.objectContaining({ body: message })
      );
    });

    test('should not create duplicate notifications for the same item', async () => {
      const item = { id: '1', name: 'Test Item' };
      
      await notificationManager.notifyLowStock(item, 'First notification');
      await notificationManager.notifyLowStock(item, 'Second notification');
      
      // Should only be called once for the same item ID
      expect(Notification).toHaveBeenCalledTimes(1);
    });

    test('should create notifications for different items', async () => {
      const item1 = { id: '1', name: 'Item 1' };
      const item2 = { id: '2', name: 'Item 2' };
      
      await notificationManager.notifyLowStock(item1, 'Item 1 is low');
      await notificationManager.notifyLowStock(item2, 'Item 2 is low');
      
      expect(Notification).toHaveBeenCalledTimes(2);
    });

    test('should not create notification if permission is not granted', async () => {
      // Temporarily change permission
      const originalPermission = Notification.permission;
      Notification.permission = 'denied';
      
      const item = { id: '1', name: 'Test Item' };
      await notificationManager.notifyLowStock(item, 'Test message');
      
      expect(Notification).not.toHaveBeenCalled();
      
      // Restore permission
      Notification.permission = originalPermission;
    });
  });

  describe('notifyGeneral', () => {
    test('should create a notification with correct title and body', async () => {
      const title = 'Test Title';
      const body = 'Test Body';
      
      await notificationManager.notifyGeneral(title, body);
      
      expect(Notification).toHaveBeenCalledWith(
        title,
        expect.objectContaining({ body })
      );
    });

    test('should create multiple general notifications', async () => {
      await notificationManager.notifyGeneral('Title 1', 'Body 1');
      await notificationManager.notifyGeneral('Title 2', 'Body 2');
      
      expect(Notification).toHaveBeenCalledTimes(2);
    });

    test('should not create notification if permission is not granted', async () => {
      // Temporarily change permission
      const originalPermission = Notification.permission;
      Notification.permission = 'denied';
      
      await notificationManager.notifyGeneral('Test Title', 'Test Body');
      
      expect(Notification).not.toHaveBeenCalled();
      
      // Restore permission
      Notification.permission = originalPermission;
    });
  });

  describe('Edge cases', () => {
    test('should handle undefined Notification API', async () => {
      // Temporarily remove Notification
      const originalNotification = global.Notification;
      global.Notification = undefined;
      
      // Should not throw errors
      await expect(notificationManager.notifyLowStock({ id: '1', name: 'Test' }, 'Message')).resolves.not.toThrow();
      await expect(notificationManager.notifyGeneral('Title', 'Body')).resolves.not.toThrow();
      
      // Restore Notification
      global.Notification = originalNotification;
    });
  });
});