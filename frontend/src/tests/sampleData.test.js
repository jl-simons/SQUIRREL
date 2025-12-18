// src/tests/sampleData.test.js

import { sampleInventoryItems, initializeWithSampleData } from '../utils/sampleData';

describe('Sample Data', () => {
  describe('sampleInventoryItems', () => {
    test('should be an array of inventory items', () => {
      expect(Array.isArray(sampleInventoryItems)).toBe(true);
      expect(sampleInventoryItems.length).toBeGreaterThan(0);
    });

    test('each item should have required properties', () => {
      sampleInventoryItems.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('location');
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('dateAdded');
        expect(item).toHaveProperty('dateUpdated');
      });
    });

    test('each item should have valid data types', () => {
      sampleInventoryItems.forEach(item => {
        expect(typeof item.id).toBe('string');
        expect(typeof item.name).toBe('string');
        expect(typeof item.quantity).toBe('number');
        expect(typeof item.location).toBe('string');
        expect(typeof item.category).toBe('string');
        expect(Array.isArray(item.tags)).toBe(true);
        expect(typeof item.dateAdded).toBe('string');
        expect(typeof item.dateUpdated).toBe('string');
        expect(typeof item.lowStockThreshold).toBe('number');
        expect(typeof item.value).toBe('number');
      });
    });
  });

  describe('initializeWithSampleData', () => {
    test('should initialize with sample data when inventory is empty', () => {
      const getInventory = jest.fn().mockReturnValue([]);
      const setInventory = jest.fn();
      
      const result = initializeWithSampleData(getInventory, setInventory);
      
      expect(result).toBe(true);
      expect(getInventory).toHaveBeenCalled();
      expect(setInventory).toHaveBeenCalledWith(sampleInventoryItems);
    });

    test('should not initialize when inventory already has items', () => {
      const existingItems = [{ id: 'existing', name: 'Existing Item' }];
      const getInventory = jest.fn().mockReturnValue(existingItems);
      const setInventory = jest.fn();
      
      const result = initializeWithSampleData(getInventory, setInventory);
      
      expect(result).toBe(false);
      expect(getInventory).toHaveBeenCalled();
      expect(setInventory).not.toHaveBeenCalled();
    });

    test('should handle edge cases with getInventory', () => {
      // Test with null
      const getInventoryNull = jest.fn().mockReturnValue(null);
      const setInventory = jest.fn();
      
      // This should throw an error because we're trying to check length of null
      expect(() => {
        initializeWithSampleData(getInventoryNull, setInventory);
      }).toThrow();
      
      // Test with undefined
      const getInventoryUndefined = jest.fn().mockReturnValue(undefined);
      
      // This should throw an error because we're trying to check length of undefined
      expect(() => {
        initializeWithSampleData(getInventoryUndefined, setInventory);
      }).toThrow();
    });

    test('should log a message when initializing with sample data', () => {
      const getInventory = jest.fn().mockReturnValue([]);
      const setInventory = jest.fn();
      const consoleSpy = jest.spyOn(console, 'log');
      
      initializeWithSampleData(getInventory, setInventory);
      
      expect(consoleSpy).toHaveBeenCalledWith('Initialized app with sample inventory data');
      
      consoleSpy.mockRestore();
    });
  });
});