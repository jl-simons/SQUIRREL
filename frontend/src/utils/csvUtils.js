/**
 * CSV Utilities
 * 
 * Provides functions for importing and exporting inventory data in CSV format.
 * Handles parsing, validation, and formatting of CSV data.
 */

// Required fields for a valid inventory item CSV
const REQUIRED_HEADERS = ['id', 'name', 'quantity'];

/**
 * Converts inventory items to CSV format
 * 
 * @param {Array} items - Array of inventory items to convert
 * @returns {string} CSV formatted string
 * @throws {Error} If items is not an array
 */
export const exportToCSV = (items) => {
  try {
    // Validate input
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }

    // If array is empty, return just the headers
    if (items.length === 0) {
      return REQUIRED_HEADERS.join(',');
    }

    // Get all unique keys from all items to use as headers
    const allKeys = new Set();
    items.forEach(item => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(key => allKeys.add(key));
      }
    });

    // Ensure required headers are included first
    const headers = [...REQUIRED_HEADERS];
    allKeys.forEach(key => {
      if (!REQUIRED_HEADERS.includes(key)) {
        headers.push(key);
      }
    });

    // Create CSV header row
    let csv = headers.join(',') + '\n';

    // Add data rows
    items.forEach(item => {
      if (item && typeof item === 'object') {
        const row = headers.map(header => {
          const value = item[header];
          // Handle different value types and escape commas
          if (value === undefined || value === null) {
            return '';
          } else if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          } else {
            return String(value);
          }
        });
        csv += row.join(',') + '\n';
      }
    });

    return csv.trim();
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
};

/**
 * Parses CSV data into inventory items
 * 
 * @param {string} csvData - CSV formatted string to parse
 * @returns {Array} Array of inventory items
 * @throws {Error} If CSV data is invalid or required headers are missing
 */
export const importFromCSV = (csvData) => {
  try {
    // Validate input
    if (!csvData || typeof csvData !== 'string') {
      throw new Error('CSV data must be a non-empty string');
    }

    // Validate CSV format
    if (!validateCSV(csvData)) {
      throw new Error('Invalid CSV format');
    }

    // Split into rows and remove empty rows
    const rows = csvData.split('\n').filter(row => row.trim());
    if (rows.length === 0) {
      return [];
    }

    // Parse headers
    const headers = parseCSVRow(rows[0]);

    // Check for required headers
    REQUIRED_HEADERS.forEach(requiredHeader => {
      if (!headers.includes(requiredHeader)) {
        throw new Error(`Required header "${requiredHeader}" is missing`);
      }
    });

    // Parse data rows
    const items = [];
    for (let i = 1; i < rows.length; i++) {
      const values = parseCSVRow(rows[i]);
      if (values.length === headers.length) {
        const item = {};
        headers.forEach((header, index) => {
          // Convert numeric values
          const value = values[index];
          if (header === 'quantity' || header === 'id') {
            const numValue = Number(value);
            item[header] = isNaN(numValue) ? value : numValue;
          } else {
            item[header] = value;
          }
        });
        items.push(item);
      }
    }

    return items;
  } catch (error) {
    console.error('Error importing from CSV:', error);
    throw error;
  }
};

/**
 * Validates CSV data format
 * 
 * @param {string} csvData - CSV formatted string to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateCSV = (csvData) => {
  try {
    // Basic validation
    if (!csvData || typeof csvData !== 'string') {
      return false;
    }

    // Split into rows and remove empty rows
    const rows = csvData.split('\n').filter(row => row.trim());
    if (rows.length === 0) {
      return false;
    }

    // Check headers
    const headers = parseCSVRow(rows[0]);
    if (headers.length === 0) {
      return false;
    }

    // Check for required headers
    for (const requiredHeader of REQUIRED_HEADERS) {
      if (!headers.includes(requiredHeader)) {
        return false;
      }
    }

    // Check that all rows have the same number of columns
    const headerCount = headers.length;
    for (let i = 1; i < rows.length; i++) {
      const values = parseCSVRow(rows[i]);
      if (values.length !== headerCount) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating CSV:', error);
    return false;
  }
};

/**
 * Helper function to parse a CSV row, handling quoted values with commas
 * 
 * @param {string} row - CSV row to parse
 * @returns {Array} Array of values
 * @private
 */
function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      // Handle escaped quotes (two double quotes in a row)
      if (i + 1 < row.length && row[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      // Add character to current field
      current += char;
    }
  }

  // Add the last field
  result.push(current);

  return result;
}
