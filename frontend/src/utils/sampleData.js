/**
 * Sample Inventory Data
 * 
 * This file provides sample inventory data for initial app loading.
 * It's used to ensure the app has data to display when first run.
 */

export const sampleInventoryItems = [
  {
    id: '1',
    name: 'Milk',
    quantity: 1,
    location: 'Refrigerator',
    category: 'Food',
    tags: ['perishable', 'dairy'],
    dateAdded: '2023-06-01T12:00:00.000Z',
    dateUpdated: '2023-06-01T12:00:00.000Z',
    lowStockThreshold: 2,
    value: 3.99
  },
  {
    id: '2',
    name: 'Bread',
    quantity: 2,
    location: 'Pantry',
    category: 'Food',
    tags: ['perishable', 'grain'],
    dateAdded: '2023-06-01T12:00:00.000Z',
    dateUpdated: '2023-06-01T12:00:00.000Z',
    lowStockThreshold: 1,
    value: 2.49
  },
  {
    id: '3',
    name: 'Soap',
    quantity: 5,
    location: 'Bathroom',
    category: 'Cleaning',
    tags: ['hygiene'],
    dateAdded: '2023-06-01T12:00:00.000Z',
    dateUpdated: '2023-06-01T12:00:00.000Z',
    lowStockThreshold: 2,
    value: 1.99
  },
  {
    id: '4',
    name: 'Batteries',
    quantity: 8,
    location: 'Drawer',
    category: 'Electronics',
    tags: ['essential'],
    dateAdded: '2023-06-01T12:00:00.000Z',
    dateUpdated: '2023-06-01T12:00:00.000Z',
    lowStockThreshold: 4,
    value: 9.99
  },
  {
    id: '5',
    name: 'Paper Towels',
    quantity: 1,
    location: 'Closet',
    category: 'Household',
    tags: ['essential'],
    dateAdded: '2023-06-01T12:00:00.000Z',
    dateUpdated: '2023-06-01T12:00:00.000Z',
    lowStockThreshold: 2,
    value: 5.99
  }
];

/**
 * Initializes the app with sample data if no data exists yet
 * @param {Function} getInventory - Function to get current inventory
 * @param {Function} setInventory - Function to set inventory
 */
export function initializeWithSampleData(getInventory, setInventory) {
  const currentInventory = getInventory();
  
  // Only initialize if inventory is empty
  if (currentInventory.length === 0) {
    setInventory(sampleInventoryItems);
    console.log('Initialized app with sample inventory data');
    return true;
  }
  
  return false;
}