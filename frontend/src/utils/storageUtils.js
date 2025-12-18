/**
 * Storage Utilities
 * 
 * Provides functions for managing inventory data in localStorage.
 * Includes error handling and validation for all operations.
 */

const STORAGE_KEY = 'inventory_items';

/**
 * Returns the inventory array from localStorage, or [] if not found.
 * Handles errors and invalid JSON gracefully.
 * 
 * @returns {Array} The inventory array or an empty array if not found or error
 */
export function getInventory() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        const parsedData = JSON.parse(data);
        return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
        console.error('Error retrieving inventory from localStorage:', error);
        return [];
    }
}

/**
 * Saves the inventory array to localStorage.
 * Handles errors gracefully.
 * 
 * @param {Array} items - Array of inventory item objects
 * @returns {boolean} True if successful, false if error
 */
export function setInventory(items) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        // Notify listeners (e.g., Dashboard) that inventory changed
        try {
            window.dispatchEvent(new CustomEvent('squirrel-inventory-changed'));
        } catch (_) {}
        return true;
    } catch (error) {
        console.error('Error saving inventory to localStorage:', error);
        return false;
    }
}

/**
 * Adds a new item to the inventory.
 * Validates that the item is an object before adding.
 * 
 * @param {Object} item - The item to add
 * @returns {boolean} True if successful, false if error or invalid input
 */
export function addItem(item) {
    try {
        if (!item || typeof item !== 'object') {
            console.error('Invalid item provided to addItem:', item);
            return false;
        }

        const items = getInventory();
        items.push(item);
        return setInventory(items);
    } catch (error) {
        console.error('Error adding item to inventory:', error);
        return false;
    }
}

/**
 * Updates an existing item (matched by id).
 * Only updates the first item with matching id if multiple exist.
 * 
 * @param {String} id - ID of the item to update
 * @param {Object} updates - Object with updated properties
 * @returns {boolean} True if item was found and updated, false otherwise
 */
export function updateItem(id, updates) {
    try {
        if (!id || !updates || typeof updates !== 'object') {
            console.error('Invalid parameters provided to updateItem:', { id, updates });
            return false;
        }

        const items = getInventory();
        const idx = items.findIndex(i => i.id === id);

        if (idx !== -1) {
            items[idx] = { ...items[idx], ...updates };
            return setInventory(items);
        }

        return false;
    } catch (error) {
        console.error('Error updating item in inventory:', error);
        return false;
    }
}

/**
 * Deletes all items from the inventory with matching id.
 * 
 * @param {String} id - ID of the item(s) to delete
 * @returns {boolean} True if successful (even if no items were deleted), false if error
 */
export function deleteItem(id) {
    try {
        if (!id) {
            console.error('Invalid id provided to deleteItem:', id);
            return false;
        }

        const items = getInventory();
        const filteredItems = items.filter(i => i.id !== id);

        return setInventory(filteredItems);
    } catch (error) {
        console.error('Error deleting item from inventory:', error);
        return false;
    }
}
