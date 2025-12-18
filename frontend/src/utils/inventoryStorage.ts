import {
  InventoryItem,
  InventoryStorage,
  validateInventoryStorage,
  validateInventoryItem,
  createEmptyInventoryStorage,
  CURRENT_SCHEMA_VERSION,
} from '../models/inventory';
import { z } from 'zod';

const STORAGE_KEY = 'inventory_items';

/**
 * Error thrown when a write operation fails due to concurrent modification
 */
export class ConcurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConcurrencyError';
  }
}

/**
 * Migrates old inventory format (raw array) to new format (storage wrapper)
 * @param data - Raw localStorage data
 * @returns Migrated InventoryStorage object
 */
function migrateInventoryData(data: unknown): InventoryStorage {
  // If data is already in new format, validate and return
  if (
    data &&
    typeof data === 'object' &&
    'schemaVersion' in data &&
    'revision' in data &&
    'items' in data
  ) {
    try {
      return validateInventoryStorage(data);
    } catch (error) {
      console.warn('Invalid storage format, attempting migration:', error);
    }
  }

  // Migrate from old format (raw array)
  if (Array.isArray(data)) {
    const items: InventoryItem[] = [];

    // Validate each item and add to items array
    for (const item of data) {
      try {
        const validatedItem = validateInventoryItem(item);
        items.push(validatedItem);
      } catch (error) {
        console.warn('Skipping invalid item during migration:', item, error);
      }
    }

    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      revision: 0,
      items,
    };
  }

  // If data is invalid or empty, return empty storage
  console.warn('Could not migrate inventory data, starting fresh');
  return createEmptyInventoryStorage();
}

/**
 * Reads inventory from localStorage with migration support
 * @returns InventoryStorage object
 */
export function readInventoryStorage(): InventoryStorage {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);

    if (!rawData) {
      return createEmptyInventoryStorage();
    }

    const parsedData = JSON.parse(rawData);
    return migrateInventoryData(parsedData);
  } catch (error) {
    console.error('Error reading inventory from localStorage:', error);
    return createEmptyInventoryStorage();
  }
}

/**
 * Writes inventory to localStorage with revision increment
 * @param storage - InventoryStorage object to write
 */
function writeInventoryStorage(storage: InventoryStorage): void {
  try {
    // Validate storage before writing
    const validatedStorage = validateInventoryStorage(storage);

    // Write to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedStorage));

    // Dispatch custom event for multi-tab sync and UI updates
    window.dispatchEvent(new CustomEvent('squirrel-inventory-changed'));
  } catch (error) {
    console.error('Error writing inventory to localStorage:', error);
    throw error;
  }
}

/**
 * Executes a storage operation with optimistic concurrency control
 * Automatically retries on concurrency conflicts
 *
 * @param operation - Function that receives current storage and returns updated storage
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns The result of the operation
 */
export function withConcurrencyControl<T>(
  operation: (storage: InventoryStorage) => { storage: InventoryStorage; result: T },
  maxRetries = 3
): T {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Read current storage state
      const currentStorage = readInventoryStorage();
      const initialRevision = currentStorage.revision;

      // Execute operation
      const { storage: updatedStorage, result } = operation(currentStorage);

      // Re-read to check for concurrent modifications
      const latestStorage = readInventoryStorage();

      // Check if revision changed during operation
      if (latestStorage.revision !== initialRevision) {
        attempt++;

        if (attempt >= maxRetries) {
          throw new ConcurrencyError(
            `Concurrent modification detected after ${maxRetries} retries`
          );
        }

        // Retry operation
        console.warn(
          `Revision mismatch detected (expected ${initialRevision}, got ${latestStorage.revision}), retrying... (attempt ${attempt})`
        );
        continue;
      }

      // Increment revision and write
      updatedStorage.revision = initialRevision + 1;
      writeInventoryStorage(updatedStorage);

      return result;
    } catch (error) {
      if (error instanceof ConcurrencyError) {
        throw error;
      }
      console.error('Error in concurrency-controlled operation:', error);
      throw error;
    }
  }

  throw new ConcurrencyError('Max retries exceeded');
}

/**
 * Gets all inventory items
 * @returns Array of inventory items
 */
export function getInventory(): InventoryItem[] {
  const storage = readInventoryStorage();
  return storage.items;
}

/**
 * Sets the entire inventory (replaces all items)
 * @param items - Array of inventory items
 */
export function setInventory(items: InventoryItem[]): void {
  withConcurrencyControl((storage) => ({
    storage: {
      ...storage,
      items: items.map((item) => validateInventoryItem(item)),
    },
    result: undefined,
  }));
}

/**
 * Adds a new item to the inventory
 * @param item - Item to add
 */
export function addItem(item: InventoryItem): void {
  const validatedItem = validateInventoryItem(item);

  withConcurrencyControl((storage) => ({
    storage: {
      ...storage,
      items: [...storage.items, validatedItem],
    },
    result: undefined,
  }));
}

/**
 * Updates an existing item by ID
 * @param id - ID of the item to update
 * @param updates - Partial updates to apply
 * @returns True if item was found and updated, false otherwise
 */
export function updateItem(id: string, updates: Partial<InventoryItem>): boolean {
  return withConcurrencyControl((storage) => {
    const itemIndex = storage.items.findIndex((item) => item.id === id);

    if (itemIndex === -1) {
      return { storage, result: false };
    }

    // Merge updates and validate
    const updatedItem = validateInventoryItem({
      ...storage.items[itemIndex],
      ...updates,
      dateUpdated: new Date().toISOString(),
    });

    // Create new items array with updated item
    const newItems = [...storage.items];
    newItems[itemIndex] = updatedItem;

    return {
      storage: {
        ...storage,
        items: newItems,
      },
      result: true,
    };
  });
}

/**
 * Deletes an item by ID
 * @param id - ID of the item to delete
 * @returns True if item was found and deleted, false otherwise
 */
export function deleteItem(id: string): boolean {
  return withConcurrencyControl((storage) => {
    const initialLength = storage.items.length;
    const newItems = storage.items.filter((item) => item.id !== id);

    return {
      storage: {
        ...storage,
        items: newItems,
      },
      result: newItems.length < initialLength,
    };
  });
}

/**
 * Gets the current revision number
 * Useful for debugging and monitoring
 * @returns Current revision number
 */
export function getCurrentRevision(): number {
  const storage = readInventoryStorage();
  return storage.revision;
}

/**
 * Gets the current schema version
 * @returns Current schema version
 */
export function getSchemaVersion(): number {
  const storage = readInventoryStorage();
  return storage.schemaVersion;
}

// Export types for consumers
export type { InventoryItem, InventoryStorage } from '../models/inventory';
export { ConcurrencyError as InventoryConcurrencyError };
