/**
 * Tests for CSV Utilities
 */

import { exportToCSV, importFromCSV, validateCSV } from '../utils/csvUtils';

describe('CSV Utilities', () => {
  describe('exportToCSV', () => {
    test('should convert inventory items to CSV format', () => {
      // Arrange
      const items = [
        { id: 1, name: 'Item 1', quantity: 5 },
        { id: 2, name: 'Item 2', quantity: 10 }
      ];

      // Act
      const result = exportToCSV(items);

      // Assert
      expect(typeof result).toBe('string');
      expect(result).toContain('id,name,quantity');
      expect(result).toContain('1,Item 1,5');
      expect(result).toContain('2,Item 2,10');
    });

    test('should handle empty array', () => {
      // Arrange
      const items = [];

      // Act
      const result = exportToCSV(items);

      // Assert
      expect(result).toBe('id,name,quantity');
    });

    test('should include all unique keys as headers', () => {
      // Arrange
      const items = [
        { id: 1, name: 'Item 1', quantity: 5, location: 'Kitchen' },
        { id: 2, name: 'Item 2', quantity: 10, category: 'Food' }
      ];

      // Act
      const result = exportToCSV(items);

      // Assert
      expect(result).toContain('id,name,quantity,location,category');
      expect(result).toContain('1,Item 1,5,Kitchen,');
      expect(result).toContain('2,Item 2,10,,Food');
    });

    test('should properly escape values with commas', () => {
      // Arrange
      const items = [
        { id: 1, name: 'Item, with comma', quantity: 5 }
      ];

      // Act
      const result = exportToCSV(items);

      // Assert
      expect(result).toContain('id,name,quantity');
      expect(result).toContain('1,"Item, with comma",5');
    });

    test('should handle null and undefined values', () => {
      // Arrange
      const items = [
        { id: 1, name: null, quantity: undefined }
      ];

      // Act
      const result = exportToCSV(items);

      // Assert
      expect(result).toContain('id,name,quantity');
      expect(result).toContain('1,,');
    });

    test('should throw error for non-array input', () => {
      // Arrange
      const invalidInputs = [null, undefined, 'string', 123, {}];

      // Assert
      invalidInputs.forEach(input => {
        expect(() => exportToCSV(input)).toThrow('Items must be an array');
      });
    });
  });

  describe('importFromCSV', () => {
    test('should parse CSV data into inventory items', () => {
      // Arrange
      const csvData = 'id,name,quantity\n1,Item 1,5\n2,Item 2,10';

      // Act
      const result = importFromCSV(csvData);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 1, name: 'Item 1', quantity: 5 });
      expect(result[1]).toEqual({ id: 2, name: 'Item 2', quantity: 10 });
    });

    test('should convert numeric values correctly', () => {
      // Arrange
      const csvData = 'id,name,quantity\n1,Item 1,5.5\nA2,Item 2,NotANumber';

      // Act
      const result = importFromCSV(csvData);

      // Assert
      expect(result[0].id).toBe(1); // Number
      expect(result[0].quantity).toBe(5.5); // Number
      expect(result[1].id).toBe('A2'); // String (not a valid number)
      expect(result[1].quantity).toBe('NotANumber'); // String (not a valid number)
    });

    test('should handle quoted values with commas', () => {
      // Arrange
      const csvData = 'id,name,quantity\n1,"Item, with comma",5';

      // Act
      const result = importFromCSV(csvData);

      // Assert
      expect(result[0].name).toBe('Item, with comma');
    });

    test('should handle escaped quotes', () => {
      // Arrange
      const csvData = 'id,name,quantity\n1,"Item ""quoted"" text",5';

      // Act
      const result = importFromCSV(csvData);

      // Assert
      expect(result[0].name).toBe('Item "quoted" text');
    });

    test('should throw error for invalid CSV format', () => {
      // Arrange
      const invalidCsvData = 'invalid,csv\nformat';

      // Assert
      expect(() => importFromCSV(invalidCsvData)).toThrow('Invalid CSV format');
    });

    test('should throw error for missing required headers', () => {
      // Arrange
      const missingHeaderCsv = 'id,name\n1,Item 1';

      // Assert
      expect(() => importFromCSV(missingHeaderCsv)).toThrow('Invalid CSV format');
    });

    test('should throw error for non-string input', () => {
      // Arrange
      const invalidInputs = [null, undefined, 123, [], {}];

      // Assert
      invalidInputs.forEach(input => {
        expect(() => importFromCSV(input)).toThrow();
      });
    });
  });

  describe('validateCSV', () => {
    test('should validate correct CSV data format', () => {
      // Arrange
      const validCsvData = 'id,name,quantity\n1,Item 1,5';

      // Act
      const result = validateCSV(validCsvData);

      // Assert
      expect(result).toBe(true);
    });

    test('should reject CSV without required headers', () => {
      // Arrange
      const invalidHeaders = 'id,description,amount\n1,Item 1,5';

      // Act
      const result = validateCSV(invalidHeaders);

      // Assert
      expect(result).toBe(false);
    });

    test('should reject CSV with inconsistent column count', () => {
      // Arrange
      const inconsistentColumns = 'id,name,quantity\n1,Item 1\n2,Item 2,10,extra';

      // Act
      const result = validateCSV(inconsistentColumns);

      // Assert
      expect(result).toBe(false);
    });

    test('should reject empty or non-string input', () => {
      // Arrange
      const invalidInputs = ['', null, undefined, 123, [], {}];

      // Assert
      invalidInputs.forEach(input => {
        expect(validateCSV(input)).toBe(false);
      });
    });

    test('should handle CSV with quoted values correctly', () => {
      // Arrange
      const quotedCsv = 'id,name,quantity\n1,"Item, with comma",5';

      // Act
      const result = validateCSV(quotedCsv);

      // Assert
      expect(result).toBe(true);
    });
  });
});
