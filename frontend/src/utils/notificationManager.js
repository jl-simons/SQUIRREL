/**
 * NotificationManager Interface
 * @typedef {Object} NotificationManager
 * @property {(item: InventoryItem, message: string) => Promise<void>} notifyLowStock
 * @property {(title: string, body: string) => Promise<void>} notifyGeneral
 */

/**
 * @returns {NotificationManager} Browser Notification API implementation
 */
export function createBrowserNotificationManager() {
    // Keep track of which items have already triggered notifications this session
    const notifiedItemIds = new Set();

    return {
        async notifyLowStock(item, message) {
            if (notifiedItemIds.has(item.id)) return;
            if (Notification && Notification.permission === "granted") {
                new Notification(`Low Stock: ${item.name}`, { body: message });
                notifiedItemIds.add(item.id);
            }
        },
        async notifyGeneral(title, body) {
            if (Notification && Notification.permission === "granted") {
                new Notification(title, { body });
            }
        }
    };
}
