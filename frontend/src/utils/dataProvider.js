/**
 * DataProvider Interface
 * @typedef {Object} DataProvider
 * @property {() => Promise<InventoryItem[]>} getAll
 * @property {(item: InventoryItem) => Promise<void>} add
 * @property {(id: string, updates: Partial<InventoryItem>) => Promise<void>} update
 * @property {(id: string) => Promise<void>} remove
 * @property {(items: InventoryItem[]) => Promise<void>} setAll
 */

/**
 * @returns {DataProvider} LocalStorage-based implementation
 */
export function createLocalDataProvider(storageKey = 'inventory_items') {
    return {
        async getAll() {
            try {
                const data = localStorage.getItem(storageKey);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                console.error('Error getting items from localStorage:', error);
                return [];
            }
        },
        async add(item) {
            try {
                const items = await this.getAll();
                items.push(item);
                localStorage.setItem(storageKey, JSON.stringify(items));
            } catch (error) {
                console.error('Error adding item to localStorage:', error);
            }
        },
        async update(id, updates) {
            try {
                const items = await this.getAll();
                const idx = items.findIndex(i => i.id === id);
                if (idx !== -1) {
                    items[idx] = { ...items[idx], ...updates, dateUpdated: new Date().toISOString() };
                    localStorage.setItem(storageKey, JSON.stringify(items));
                }
            } catch (error) {
                console.error('Error updating item in localStorage:', error);
            }
        },
        async remove(id) {
            try {
                const items = await this.getAll();
                localStorage.setItem(storageKey, JSON.stringify(items.filter(i => i.id !== id)));
            } catch (error) {
                console.error('Error removing item from localStorage:', error);
            }
        },
        async setAll(newItems) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(newItems));
            } catch (error) {
                console.error('Error setting items in localStorage:', error);
            }
        }
    };
}
