/**
 * @typedef {Object} InventoryItem
 * @property {string} id - Unique identifier (UUID)
 * @property {string} name - Name of the item
 * @property {number} quantity - Amount remaining
 * @property {string} location - Last known location
 * @property {string} [category] - Category (e.g., 'Food', 'Cleaning')
 * @property {string[]} [tags] - Tags (e.g., ['Perishable', 'High-value'])
 * @property {string} dateAdded - ISO date string
 * @property {string} dateUpdated - ISO date string
 * @property {number} [lowStockThreshold] - Custom low-stock alert threshold for this item
 * @property {number} [value] - Optional monetary value for future finance integration
 */
