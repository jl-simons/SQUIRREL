import React, { useRef, useState } from 'react';

/**
 * InventoryTable
 * Displays a list of inventory items with support for edit, delete, and visual low-stock indication.
 * Supports column sorting and keyboard navigation.
 *
 * Props:
 * - items: array of InventoryItem objects
 * - onEdit: function(item) - called when edit button is clicked
 * - onDelete: function(id) - called when delete button is clicked
 * - lowStockThreshold: number (global default, optional)
 * - filter: function(item) => boolean (optional, to apply external search/filtering)
 * - caption: string (optional, table caption for screen readers)
 * - initialSortColumn: string (optional, column to initially sort by)
 * - initialSortDirection: string (optional, 'asc' or 'desc')
 */

function isLowStock(item, globalThreshold = 2) {
  const threshold = item.lowStockThreshold ?? globalThreshold;
  return Number(item.quantity) < Number(threshold);
}

export default function InventoryTable({
  items,
  onEdit,
  onDelete,
  lowStockThreshold = 2,
  filter = () => true,
  caption = "Inventory items with details and actions",
  initialSortColumn = '',
  initialSortDirection = 'asc'
}) {
  const tableRef = useRef(null);
  const [sortColumn, setSortColumn] = useState(initialSortColumn);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);

  // State for inline editing
  const [editingCell, setEditingCell] = useState(null); // { itemId, field }
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef(null);

  // Filter items first
  const filteredItems = items ? items.filter(filter) : [];

  // Sort items based on current sort state
  const sortedItems = sortItems(filteredItems, sortColumn, sortDirection);

  // Function to sort items by column
  function sortItems(items, column, direction) {
    if (!column) return items; // No sorting if no column specified

    return [...items].sort((a, b) => {
      let aValue = a[column];
      let bValue = b[column];

      // Handle special cases for different data types
      if (column === 'tags') {
        // For tags array, convert to string for comparison
        aValue = (a.tags || []).join(', ');
        bValue = (b.tags || []).join(', ');
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        // Case-insensitive string comparison
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (aValue === undefined || aValue === null) {
        // Handle undefined/null values
        aValue = '';
      } else if (bValue === undefined || bValue === null) {
        bValue = '';
      }

      // Perform the comparison
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Handle column header click for sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Handle keyboard navigation within the table
  const handleTableKeyDown = (e, item, index) => {
    // Handle edit/delete actions with keyboard
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.target.classList.contains('edit-button')) {
        onEdit && onEdit(item);
      } else if (e.target.classList.contains('delete-button')) {
        onDelete && onDelete(item.id);
      }
    }

    // Arrow key navigation between rows
    if (e.key === 'ArrowDown' && index < sortedItems.length - 1) {
      e.preventDefault();
      const nextRow = tableRef.current.querySelector(`tr[data-row-index="${index + 1}"]`);
      const nextFocusable = nextRow?.querySelector('button');
      if (nextFocusable) {
        nextFocusable.focus();
        // Store the current item index for keyboard actions
        nextFocusable.dataset.itemIndex = index + 1;
      }
    }

    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      const prevRow = tableRef.current.querySelector(`tr[data-row-index="${index - 1}"]`);
      const prevFocusable = prevRow?.querySelector('button');
      if (prevFocusable) {
        prevFocusable.focus();
        // Store the current item index for keyboard actions
        prevFocusable.dataset.itemIndex = index - 1;
      }
    }
  };

  // Handle keyboard events for column headers
  const handleHeaderKeyDown = (e, column) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSort(column);
    }
  };

  // Start editing a cell
  const startEditing = (itemId, field, value) => {
    setEditingCell({ itemId, field });
    setEditValue(value !== undefined && value !== null ? value.toString() : '');

    // Focus the input after it's rendered
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 10);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Save the edited value
  const saveEdit = (itemId) => {
    if (editingCell && editingCell.itemId === itemId) {
      const field = editingCell.field;
      let value = editValue;

      // Convert value to appropriate type
      if (field === 'quantity' || field === 'value' || field === 'lowStockThreshold') {
        value = value === '' ? 0 : Number(value);

        // Validate numeric fields
        if (isNaN(value) || value < 0) {
          // Show validation error
          return false;
        }
      }

      // Call onEdit with the updated item
      const item = sortedItems.find(item => item.id === itemId);
      if (item && onEdit) {
        const updatedItem = { ...item, [field]: value };
        onEdit(updatedItem);
      }

      // Exit edit mode
      setEditingCell(null);
      setEditValue('');
      return true;
    }
    return false;
  };

  // Handle keyboard events in edit mode
  const handleEditKeyDown = (e, itemId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(itemId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  // Handle double-click to start editing
  const handleCellDoubleClick = (itemId, field, value) => {
    // Only allow editing certain fields
    const editableFields = ['name', 'quantity', 'location', 'category', 'value'];
    if (editableFields.includes(field)) {
      startEditing(itemId, field, value);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="empty-inventory" role="status" aria-live="polite">
        <h2>No Items Found</h2>
        <p>No items in inventory. Add some items to get started.</p>
      </div>
    );
  }

  // CSS styles for sortable headers and editable cells
  const tableStyles = {
    sortableHeader: {
      cursor: 'pointer',
      userSelect: 'none',
      position: 'relative',
      paddingRight: '24px', // Space for the sort indicator
      transition: 'background-color 0.2s',
    },
    sorted: {
      backgroundColor: '#f0f0f0',
    },
    sortIndicator: {
      position: 'absolute',
      right: '8px',
      color: '#666',
    },
    headerHover: {
      backgroundColor: '#e8e8e8',
    },
    // Styles for editable cells
    editableCell: {
      cursor: 'pointer',
      position: 'relative',
      transition: 'background-color 0.2s',
    },
    editableCellHover: {
      backgroundColor: '#f9f9f9',
    },
    editMode: {
      padding: '0',
    },
    editInput: {
      width: '100%',
      padding: '8px',
      boxSizing: 'border-box',
      border: '2px solid #2d87f0',
      borderRadius: '4px',
      fontSize: '1rem',
    },
    editControls: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '4px',
    },
    saveButton: {
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '4px 8px',
      cursor: 'pointer',
    },
    cancelButton: {
      backgroundColor: '#e63946',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '4px 8px',
      cursor: 'pointer',
    },
    editIcon: {
      marginLeft: '4px',
      opacity: '0.5',
      fontSize: '0.8rem',
    }
  };

  return (
    <div className="inventory-table-container">
      <table 
        ref={tableRef}
        className="inventory-table" 
        aria-label="Inventory"
        style={{ borderCollapse: 'collapse', width: '100%' }}
      >
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th 
              scope="col" 
              onClick={() => handleSort('name')}
              onKeyDown={(e) => handleHeaderKeyDown(e, 'name')}
              tabIndex="0"
              aria-sort={sortColumn === 'name' ? sortDirection : 'none'}
              style={{
                ...tableStyles.sortableHeader,
                ...(sortColumn === 'name' ? tableStyles.sorted : {})
              }}
            >
              Name
              {sortColumn === 'name' && (
                <span style={tableStyles.sortIndicator} aria-hidden="true">
                  {sortDirection === 'asc' ? ' ▲' : ' ▼'}
                </span>
              )}
            </th>
            <th 
              scope="col" 
              onClick={() => handleSort('quantity')}
              onKeyDown={(e) => handleHeaderKeyDown(e, 'quantity')}
              tabIndex="0"
              aria-sort={sortColumn === 'quantity' ? sortDirection : 'none'}
              style={{
                ...tableStyles.sortableHeader,
                ...(sortColumn === 'quantity' ? tableStyles.sorted : {})
              }}
            >
              Quantity
              {sortColumn === 'quantity' && (
                <span style={tableStyles.sortIndicator} aria-hidden="true">
                  {sortDirection === 'asc' ? ' ▲' : ' ▼'}
                </span>
              )}
            </th>
            <th 
              scope="col" 
              onClick={() => handleSort('location')}
              onKeyDown={(e) => handleHeaderKeyDown(e, 'location')}
              tabIndex="0"
              aria-sort={sortColumn === 'location' ? sortDirection : 'none'}
              style={{
                ...tableStyles.sortableHeader,
                ...(sortColumn === 'location' ? tableStyles.sorted : {})
              }}
            >
              Location
              {sortColumn === 'location' && (
                <span style={tableStyles.sortIndicator} aria-hidden="true">
                  {sortDirection === 'asc' ? ' ▲' : ' ▼'}
                </span>
              )}
            </th>
            <th 
              scope="col" 
              onClick={() => handleSort('category')}
              onKeyDown={(e) => handleHeaderKeyDown(e, 'category')}
              tabIndex="0"
              aria-sort={sortColumn === 'category' ? sortDirection : 'none'}
              style={{
                ...tableStyles.sortableHeader,
                ...(sortColumn === 'category' ? tableStyles.sorted : {})
              }}
            >
              Category
              {sortColumn === 'category' && (
                <span style={tableStyles.sortIndicator} aria-hidden="true">
                  {sortDirection === 'asc' ? ' ▲' : ' ▼'}
                </span>
              )}
            </th>
            <th 
              scope="col" 
              onClick={() => handleSort('tags')}
              onKeyDown={(e) => handleHeaderKeyDown(e, 'tags')}
              tabIndex="0"
              aria-sort={sortColumn === 'tags' ? sortDirection : 'none'}
              style={{
                ...tableStyles.sortableHeader,
                ...(sortColumn === 'tags' ? tableStyles.sorted : {})
              }}
            >
              Tags
              {sortColumn === 'tags' && (
                <span style={tableStyles.sortIndicator} aria-hidden="true">
                  {sortDirection === 'asc' ? ' ▲' : ' ▼'}
                </span>
              )}
            </th>
            <th 
              scope="col" 
              onClick={() => handleSort('value')}
              onKeyDown={(e) => handleHeaderKeyDown(e, 'value')}
              tabIndex="0"
              aria-sort={sortColumn === 'value' ? sortDirection : 'none'}
              style={{
                ...tableStyles.sortableHeader,
                ...(sortColumn === 'value' ? tableStyles.sorted : {})
              }}
            >
              Value ($)
              {sortColumn === 'value' && (
                <span style={tableStyles.sortIndicator} aria-hidden="true">
                  {sortDirection === 'asc' ? ' ▲' : ' ▼'}
                </span>
              )}
            </th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, index) => {
            const isItemLowStock = isLowStock(item, lowStockThreshold);
            const itemThreshold = item.lowStockThreshold ?? lowStockThreshold;

            return (
              <tr
                key={item.id}
                data-row-index={index}
                className={isItemLowStock ? 'low-stock' : ''}
                aria-labelledby={`item-name-${item.id}`}
              >
                <td 
                  style={editingCell?.itemId === item.id && editingCell?.field === 'name' 
                    ? tableStyles.editMode 
                    : tableStyles.editableCell}
                  onDoubleClick={() => handleCellDoubleClick(item.id, 'name', item.name)}
                  aria-label={editingCell?.itemId === item.id && editingCell?.field === 'name' 
                    ? "Editing name" 
                    : "Double-click to edit name"}
                >
                  {editingCell?.itemId === item.id && editingCell?.field === 'name' ? (
                    <div>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                        onBlur={() => saveEdit(item.id)}
                        style={tableStyles.editInput}
                        aria-label="Edit item name"
                      />
                      <div style={tableStyles.editControls}>
                        <button 
                          onClick={() => saveEdit(item.id)}
                          style={tableStyles.saveButton}
                          aria-label="Save name"
                        >
                          ✓ Save
                        </button>
                        <button 
                          onClick={cancelEditing}
                          style={tableStyles.cancelButton}
                          aria-label="Cancel editing"
                        >
                          ✗ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span id={`item-name-${item.id}`}>{item.name}</span>
                      <span style={tableStyles.editIcon} aria-hidden="true">✎</span>
                      {isItemLowStock && (
                        <span 
                          className="low-stock-indicator" 
                          role="img" 
                          aria-label={`Low stock warning: ${item.quantity} items remaining, threshold is ${itemThreshold}`}
                          title={`Low stock! Only ${item.quantity} remaining (threshold: ${itemThreshold})`}
                          style={{ color: "#c00", marginLeft: 4 }}
                        >
                          ⚠️
                        </span>
                      )}
                    </>
                  )}
                </td>
                <td 
                  style={editingCell?.itemId === item.id && editingCell?.field === 'quantity' 
                    ? tableStyles.editMode 
                    : tableStyles.editableCell}
                  onDoubleClick={() => handleCellDoubleClick(item.id, 'quantity', item.quantity)}
                  aria-label={editingCell?.itemId === item.id && editingCell?.field === 'quantity' 
                    ? "Editing quantity" 
                    : "Quantity - Double-click to edit"}
                >
                  {editingCell?.itemId === item.id && editingCell?.field === 'quantity' ? (
                    <div>
                      <input
                        ref={editInputRef}
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                        onBlur={() => saveEdit(item.id)}
                        style={tableStyles.editInput}
                        aria-label="Edit item quantity"
                      />
                      <div style={tableStyles.editControls}>
                        <button 
                          onClick={() => saveEdit(item.id)}
                          style={tableStyles.saveButton}
                          aria-label="Save quantity"
                        >
                          ✓ Save
                        </button>
                        <button 
                          onClick={cancelEditing}
                          style={tableStyles.cancelButton}
                          aria-label="Cancel editing"
                        >
                          ✗ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {item.quantity}
                      <span style={tableStyles.editIcon} aria-hidden="true">✎</span>
                    </>
                  )}
                </td>
                <td 
                  style={editingCell?.itemId === item.id && editingCell?.field === 'location' 
                    ? tableStyles.editMode 
                    : tableStyles.editableCell}
                  onDoubleClick={() => handleCellDoubleClick(item.id, 'location', item.location)}
                  aria-label={editingCell?.itemId === item.id && editingCell?.field === 'location' 
                    ? "Editing location" 
                    : "Double-click to edit location"}
                >
                  {editingCell?.itemId === item.id && editingCell?.field === 'location' ? (
                    <div>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                        onBlur={() => saveEdit(item.id)}
                        style={tableStyles.editInput}
                        aria-label="Edit item location"
                      />
                      <div style={tableStyles.editControls}>
                        <button 
                          onClick={() => saveEdit(item.id)}
                          style={tableStyles.saveButton}
                          aria-label="Save location"
                        >
                          ✓ Save
                        </button>
                        <button 
                          onClick={cancelEditing}
                          style={tableStyles.cancelButton}
                          aria-label="Cancel editing"
                        >
                          ✗ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {item.location || <span className="empty-value" aria-label="No location specified">–</span>}
                      <span style={tableStyles.editIcon} aria-hidden="true">✎</span>
                    </>
                  )}
                </td>
                <td 
                  style={editingCell?.itemId === item.id && editingCell?.field === 'category' 
                    ? tableStyles.editMode 
                    : tableStyles.editableCell}
                  onDoubleClick={() => handleCellDoubleClick(item.id, 'category', item.category)}
                  aria-label={editingCell?.itemId === item.id && editingCell?.field === 'category' 
                    ? "Editing category" 
                    : "Double-click to edit category"}
                >
                  {editingCell?.itemId === item.id && editingCell?.field === 'category' ? (
                    <div>
                      <select
                        ref={editInputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                        onBlur={() => saveEdit(item.id)}
                        style={tableStyles.editInput}
                        aria-label="Edit item category"
                      >
                        <option value="">None</option>
                        <option value="Food">Food</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Tools">Tools</option>
                        <option value="Other">Other</option>
                      </select>
                      <div style={tableStyles.editControls}>
                        <button 
                          onClick={() => saveEdit(item.id)}
                          style={tableStyles.saveButton}
                          aria-label="Save category"
                        >
                          ✓ Save
                        </button>
                        <button 
                          onClick={cancelEditing}
                          style={tableStyles.cancelButton}
                          aria-label="Cancel editing"
                        >
                          ✗ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {item.category || <span className="empty-value" aria-label="No category specified">–</span>}
                      <span style={tableStyles.editIcon} aria-hidden="true">✎</span>
                    </>
                  )}
                </td>
                <td aria-label="Tags">
                  {item.tags && item.tags.length > 0 ? (
                    <span className="tag-list">{item.tags.join(', ')}</span>
                  ) : (
                    <span className="empty-value" aria-label="No tags specified">–</span>
                  )}
                </td>
                <td 
                  style={editingCell?.itemId === item.id && editingCell?.field === 'value' 
                    ? tableStyles.editMode 
                    : tableStyles.editableCell}
                  onDoubleClick={() => handleCellDoubleClick(item.id, 'value', item.value)}
                  aria-label={editingCell?.itemId === item.id && editingCell?.field === 'value' 
                    ? "Editing value" 
                    : "Double-click to edit value"}
                >
                  {editingCell?.itemId === item.id && editingCell?.field === 'value' ? (
                    <div>
                      <input
                        ref={editInputRef}
                        type="number"
                        min="0"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                        onBlur={() => saveEdit(item.id)}
                        style={tableStyles.editInput}
                        aria-label="Edit item value"
                      />
                      <div style={tableStyles.editControls}>
                        <button 
                          onClick={() => saveEdit(item.id)}
                          style={tableStyles.saveButton}
                          aria-label="Save value"
                        >
                          ✓ Save
                        </button>
                        <button 
                          onClick={cancelEditing}
                          style={tableStyles.cancelButton}
                          aria-label="Cancel editing"
                        >
                          ✗ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {item.value !== undefined && item.value !== '' ? (
                        <span className="item-value">${Number(item.value).toFixed(2)}</span>
                      ) : (
                        <span className="empty-value" aria-label="No value specified">–</span>
                      )}
                      <span style={tableStyles.editIcon} aria-hidden="true">✎</span>
                    </>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="edit-button"
                      onClick={() => onEdit && onEdit(item)} 
                      onKeyDown={(e) => handleTableKeyDown(e, item, index)}
                      aria-label={`Edit ${item.name}`}
                      data-testid={`edit-button-${index}`}
                      data-item-index={index}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => onDelete && onDelete(item.id)} 
                      onKeyDown={(e) => handleTableKeyDown(e, item, index)}
                      aria-label={`Delete ${item.name}`}
                      data-testid={`delete-button-${index}`}
                      data-item-index={index}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filteredItems.length === 0 && items.length > 0 && (
        <div className="no-results" role="status" aria-live="polite">
          <p>No items match your current filters.</p>
        </div>
      )}
    </div>
  );
}
