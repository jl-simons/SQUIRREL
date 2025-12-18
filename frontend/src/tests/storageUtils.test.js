// src/tests/storageUtils.test.js

import {
    getInventory,
    setInventory,
    addItem,
    updateItem,
    deleteItem
} from '../utils/storageUtils';

// Mock localStorage
let mockLocalStorage = {};
const localStorageMock = {
  getItem: jest.fn(key => mockLocalStorage[key] || null),
  setItem: jest.fn((key, value) => {
    mockLocalStorage[key] = value;
  }),
  clear: jest.fn(() => {
    mockLocalStorage = {};
  }),
  removeItem: jest.fn(key => {
    delete mockLocalStorage[key];
  })
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Storage Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('getInventory', () => {
    test('should initialize with empty inventory when localStorage is empty', () => {
      expect(getInventory()).toEqual([]);
      expect(localStorage.getItem).toHaveBeenCalledWith('inventory_items');
    });

    test('should return parsed inventory from localStorage', () => {
      const mockItems = [{ id: '1', name: 'Test Item' }];
      localStorage.setItem('inventory_items', JSON.stringify(mockItems));
      expect(getInventory()).toEqual(mockItems);
    });

    test('should handle invalid JSON in localStorage', () => {
      localStorage.setItem('inventory_items', 'invalid-json');
      expect(getInventory()).toEqual([]);
    });
  });

  describe('setInventory', () => {
    test('should save inventory to localStorage', () => {
      const items = [{ id: '1', name: 'Test Item' }];
      setInventory(items);
      expect(localStorage.setItem).toHaveBeenCalledWith('inventory_items', JSON.stringify(items));
    });

    test('should handle empty array', () => {
      setInventory([]);
      expect(localStorage.setItem).toHaveBeenCalledWith('inventory_items', '[]');
    });

    test('should handle null or undefined', () => {
      setInventory(null);
      expect(localStorage.setItem).toHaveBeenCalledWith('inventory_items', 'null');

      setInventory(undefined);
      expect(localStorage.setItem).toHaveBeenCalledWith('inventory_items', undefined);
    });
  });

  describe('addItem', () => {
    test('should add a new item to empty inventory', () => {
      const item = { id: '1', name: 'Soap', quantity: 2, location: 'Bathroom' };
      addItem(item);
      expect(getInventory()).toEqual([item]);
    });

    test('should add a new item to existing inventory', () => {
      const item1 = { id: '1', name: 'Soap', quantity: 2 };
      const item2 = { id: '2', name: 'Shampoo', quantity: 1 };

      setInventory([item1]);
      addItem(item2);

      expect(getInventory()).toEqual([item1, item2]);
    });

    test('should handle adding item with duplicate id', () => {
      const item1 = { id: '1', name: 'Soap', quantity: 2 };
      const item2 = { id: '1', name: 'Duplicate ID', quantity: 3 };

      addItem(item1);
      addItem(item2);

      // Both items should be added (no uniqueness check in current implementation)
      expect(getInventory()).toEqual([item1, item2]);
    });
  });

  describe('updateItem', () => {
    test('should update an existing item', () => {
      const item = { id: '1', name: 'Soap', quantity: 2, location: 'Bathroom' };
      addItem(item);

      updateItem('1', { quantity: 5, name: 'Updated Soap' });

      const updatedItem = getInventory()[0];
      expect(updatedItem.quantity).toBe(5);
      expect(updatedItem.name).toBe('Updated Soap');
      expect(updatedItem.location).toBe('Bathroom'); // Unchanged property
    });

    test('should not modify inventory when updating non-existent item', () => {
      const item = { id: '1', name: 'Soap', quantity: 2 };
      addItem(item);

      updateItem('non-existent-id', { quantity: 10 });

      expect(getInventory()).toEqual([item]); // Unchanged
    });

    test('should handle updating multiple items with same id', () => {
      const item1 = { id: '1', name: 'Soap', quantity: 2 };
      const item2 = { id: '1', name: 'Duplicate ID', quantity: 3 };

      setInventory([item1, item2]);
      updateItem('1', { quantity: 10 });

      const inventory = getInventory();
      // First matching item should be updated
      expect(inventory[0].quantity).toBe(10);
      // Second matching item should remain unchanged
      expect(inventory[1].quantity).toBe(3);
    });
  });

  describe('deleteItem', () => {
    test('should delete an existing item', () => {
      const item = { id: '1', name: 'Soap', quantity: 2 };
      addItem(item);

      deleteItem('1');

      expect(getInventory()).toEqual([]);
    });

    test('should not modify inventory when deleting non-existent item', () => {
      const item = { id: '1', name: 'Soap', quantity: 2 };
      addItem(item);

      deleteItem('non-existent-id');

      expect(getInventory()).toEqual([item]); // Unchanged
    });

    test('should delete only matching items when multiple items exist', () => {
      const item1 = { id: '1', name: 'Soap' };
      const item2 = { id: '2', name: 'Shampoo' };
      const item3 = { id: '3', name: 'Toothpaste' };

      setInventory([item1, item2, item3]);
      deleteItem('2');

      expect(getInventory()).toEqual([item1, item3]);
    });

    test('should delete all items with matching id', () => {
      const item1 = { id: '1', name: 'Soap' };
      const item2 = { id: '2', name: 'Shampoo' };
      const item3 = { id: '1', name: 'Duplicate ID' };

      setInventory([item1, item2, item3]);
      deleteItem('1');

      expect(getInventory()).toEqual([item2]);
    });
  });

  describe('Error handling', () => {
    test('should handle localStorage errors when getting inventory', () => {
      localStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      expect(getInventory()).toEqual([]);
    });

    test('should handle localStorage errors when setting inventory', () => {
      localStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      // Should not throw an error
      expect(() => setInventory([{ id: '1' }])).not.toThrow();
    });
  });
});
