/**
 * InventoryItem model for the SQUIRREL Suite
 */
class InventoryItem {
  constructor(id, name, quantity, location) {
    this.id = id;
    this.name = name;
    this.quantity = quantity;
    this.location = location;
  }
}

export default InventoryItem;