import { z } from 'zod';

/**
 * Zod schema for InventoryItem
 * Validates all fields including optional ones
 */
export const InventoryItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  location: z.string().min(1, 'Location is required'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dateAdded: z.string().datetime(),
  dateUpdated: z.string().datetime(),
  lowStockThreshold: z.number().min(0).optional(),
  value: z.number().min(0).optional(),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

/**
 * Schema for the inventory storage wrapper
 * Includes schema version, revision for concurrency control, and items array
 */
export const InventoryStorageSchema = z.object({
  schemaVersion: z.number().int().positive(),
  revision: z.number().int().min(0),
  items: z.array(InventoryItemSchema),
});

/**
 * TypeScript type for inventory storage wrapper
 */
export type InventoryStorage = z.infer<typeof InventoryStorageSchema>;

/**
 * Current schema version - increment when making breaking changes
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Creates a new empty inventory storage object
 */
export function createEmptyInventoryStorage(): InventoryStorage {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    revision: 0,
    items: [],
  };
}

/**
 * Validates an inventory item using Zod schema
 * @param item - Item to validate
 * @returns Validated item or throws ZodError
 */
export function validateInventoryItem(item: unknown): InventoryItem {
  return InventoryItemSchema.parse(item);
}

/**
 * Validates inventory storage using Zod schema
 * @param storage - Storage object to validate
 * @returns Validated storage or throws ZodError
 */
export function validateInventoryStorage(storage: unknown): InventoryStorage {
  return InventoryStorageSchema.parse(storage);
}
