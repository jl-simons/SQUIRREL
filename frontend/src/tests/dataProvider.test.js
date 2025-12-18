// src/tests/dataProvider.test.js

import { createLocalDataProvider } from '../utils/dataProvider';

describe('DataProvider', () => {
  let dataProvider;
  const storageKey = 'test_inventory_items';
  
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    dataProvider = createLocalDataProvider(storageKey);
  });

  describe('getAll', () => {
    test('should return empty array when localStorage is empty', async () => {
      const items = await dataProvider.getAll();
      expect(items).toEqual([]);
      expect(localStorage.getItem).toHaveBeenCalledWith(storageKey);
    });

    test('should return parsed items from localStorage', async () => {
      const mockItems = [{ id: '1', name: 'Test Item' }];
      localStorage.setItem(storageKey, JSON.stringify(mockItems));
      
      const items = await dataProvider.getAll();
      expect(items).toEqual(mockItems);
    });
  });

  describe('add', () => {
    test('should add item to empty inventory', async () => {
      const item = { id: '1', name: 'Test Item' };
      await dataProvider.add(item);
      
      const items = await dataProvider.getAll();
      expect(items).toEqual([item]);
      expect(localStorage.setItem).toHaveBeenCalledWith(storageKey, JSON.stringify([item]));
    });

    test('should add item to existing inventory', async () => {
      const existingItem = { id: '1', name: 'Existing Item' };
      const newItem = { id: '2', name: 'New Item' };
      
      localStorage.setItem(storageKey, JSON.stringify([existingItem]));
      await dataProvider.add(newItem);
      
      const items = await dataProvider.getAll();
      expect(items).toEqual([existingItem, newItem]);
    });
  });

  describe('update', () => {
    test('should update existing item', async () => {
      const item = { id: '1', name: 'Original Name', quantity: 5 };
      localStorage.setItem(storageKey, JSON.stringify([item]));
      
      await dataProvider.update('1', { name: 'Updated Name' });
      
      const items = await dataProvider.getAll();
      expect(items[0].name).toBe('Updated Name');
      expect(items[0].quantity).toBe(5); // Unchanged property
      expect(items[0].dateUpdated).toBeDefined(); // Should add dateUpdated
    });

    test('should not modify inventory when updating non-existent item', async () => {
      const item = { id: '1', name: 'Test Item' };
      localStorage.setItem(storageKey, JSON.stringify([item]));
      
      await dataProvider.update('non-existent-id', { name: 'Updated Name' });
      
      const items = await dataProvider.getAll();
      expect(items).toEqual([item]); // Unchanged
    });
  });

  describe('remove', () => {
    test('should remove existing item', async () => {
      const item1 = { id: '1', name: 'Item 1' };
      const item2 = { id: '2', name: 'Item 2' };
      localStorage.setItem(storageKey, JSON.stringify([item1, item2]));
      
      await dataProvider.remove('1');
      
      const items = await dataProvider.getAll();
      expect(items).toEqual([item2]);
    });

    test('should not modify inventory when removing non-existent item', async () => {
      const item = { id: '1', name: 'Test Item' };
      localStorage.setItem(storageKey, JSON.stringify([item]));
      
      await dataProvider.remove('non-existent-id');
      
      const items = await dataProvider.getAll();
      expect(items).toEqual([item]); // Unchanged
    });
  });

  describe('setAll', () => {
    test('should replace all items in localStorage', async () => {
      const oldItems = [{ id: '1', name: 'Old Item' }];
      const newItems = [{ id: '2', name: 'New Item' }];
      
      localStorage.setItem(storageKey, JSON.stringify(oldItems));
      await dataProvider.setAll(newItems);
      
      const items = await dataProvider.getAll();
      expect(items).toEqual(newItems);
    });

    test('should handle empty array', async () => {
      const oldItems = [{ id: '1', name: 'Old Item' }];
      
      localStorage.setItem(storageKey, JSON.stringify(oldItems));
      await dataProvider.setAll([]);
      
      const items = await dataProvider.getAll();
      expect(items).toEqual([]);
    });
  });

  describe('Error handling', () => {
    test('should handle localStorage errors when getting items', async () => {
      localStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      const items = await dataProvider.getAll();
      expect(items).toEqual([]);
    });

    test('should handle localStorage errors when setting items', async () => {
      localStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // Should not throw an error
      await expect(dataProvider.add({ id: '1' })).resolves.not.toThrow();
    });
  });
});