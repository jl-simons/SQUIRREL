import React, { useRef, useState, useMemo, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';

/**
 * InventoryTableOptimized - Performance-optimized version with virtualization
 *
 * Optimizations applied:
 * 1. React.memo to prevent unnecessary re-renders
 * 2. useMemo for expensive sorting and filtering operations
 * 3. useCallback for all event handlers
 * 4. Virtual scrolling with react-window for large datasets
 * 5. Memoized row renderer
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
 * - useVirtualization: boolean (default: true for >50 items)
 */

function isLowStock(item, globalThreshold = 2) {
  const threshold = item.lowStockThreshold ?? globalThreshold;
  return Number(item.quantity) < Number(threshold);
}

const InventoryTableOptimized = memo(function InventoryTableOptimized({
  items,
  onEdit,
  onDelete,
  lowStockThreshold = 2,
  filter = () => true,
  caption = "Inventory items with details and actions",
  initialSortColumn = '',
  initialSortDirection = 'asc',
  useVirtualization = null // null = auto-detect based on item count
}) {
  const tableRef = useRef(null);
  const [sortColumn, setSortColumn] = useState(initialSortColumn);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);

  // State for inline editing
  const [editingCell, setEditingCell] = useState(null); // { itemId, field }
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef(null);

  // Memoize filtering - only recompute when items or filter function changes
  const filteredItems = useMemo(() => {
    return items ? items.filter(filter) : [];
  }, [items, filter]);

  // Memoized sort function
  const sortItems = useCallback((items, column, direction) => {
    if (!column) return items;

    return [...items].sort((a, b) => {
      let aValue = a[column];
      let bValue = b[column];

      if (column === 'tags') {
        aValue = (a.tags || []).join(', ');
        bValue = (b.tags || []).join(', ');
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (aValue === undefined || aValue === null) {
        aValue = '';
      } else if (bValue === undefined || bValue === null) {
        bValue = '';
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  // Memoize sorted items - only recompute when filtered items, sort column, or sort direction changes
  const sortedItems = useMemo(() => {
    return sortItems(filteredItems, sortColumn, sortDirection);
  }, [filteredItems, sortColumn, sortDirection, sortItems]);

  // Auto-detect virtualization based on item count
  const shouldVirtualize = useVirtualization ?? (sortedItems.length > 50);

  // Memoized event handlers with useCallback
  const handleSort = useCallback((column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  const handleHeaderKeyDown = useCallback((e, column) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSort(column);
    }
  }, [handleSort]);

  const startEditing = useCallback((itemId, field, value) => {
    setEditingCell({ itemId, field });
    setEditValue(value !== undefined && value !== null ? value.toString() : '');
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 10);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const saveEdit = useCallback((itemId) => {
    if (editingCell && editingCell.itemId === itemId) {
      const field = editingCell.field;
      let value = editValue;

      if (field === 'quantity' || field === 'value' || field === 'lowStockThreshold') {
        value = value === '' ? 0 : Number(value);
        if (isNaN(value) || value < 0) {
          return false;
        }
      }

      const item = sortedItems.find(item => item.id === itemId);
      if (item && onEdit) {
        const updatedItem = { ...item, [field]: value };
        onEdit(updatedItem);
      }

      setEditingCell(null);
      setEditValue('');
      return true;
    }
    return false;
  }, [editingCell, editValue, sortedItems, onEdit]);

  const handleEditKeyDown = useCallback((e, itemId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(itemId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  }, [saveEdit, cancelEditing]);

  const handleCellDoubleClick = useCallback((itemId, field, value) => {
    const editableFields = ['name', 'quantity', 'location', 'category', 'value'];
    if (editableFields.includes(field)) {
      startEditing(itemId, field, value);
    }
  }, [startEditing]);

  const handleTableKeyDown = useCallback((e, item, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.target.classList.contains('edit-button')) {
        onEdit && onEdit(item);
      } else if (e.target.classList.contains('delete-button')) {
        onDelete && onDelete(item.id);
      }
    }

    if (e.key === 'ArrowDown' && index < sortedItems.length - 1) {
      e.preventDefault();
      const nextRow = tableRef.current.querySelector(`tr[data-row-index="${index + 1}"]`);
      const nextFocusable = nextRow?.querySelector('button');
      if (nextFocusable) {
        nextFocusable.focus();
        nextFocusable.dataset.itemIndex = index + 1;
      }
    }

    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      const prevRow = tableRef.current.querySelector(`tr[data-row-index="${index - 1}"]`);
      const prevFocusable = prevRow?.querySelector('button');
      if (prevFocusable) {
        prevFocusable.focus();
        prevFocusable.dataset.itemIndex = index - 1;
      }
    }
  }, [sortedItems.length, onEdit, onDelete]);

  // Memoized styles
  const tableStyles = useMemo(() => ({
    sortableHeader: {
      cursor: 'pointer',
      userSelect: 'none',
      position: 'relative',
      paddingRight: '24px',
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
    editableCell: {
      cursor: 'pointer',
      position: 'relative',
      transition: 'background-color 0.2s',
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
  }), []);

  // Memoized table header
  const TableHeader = useMemo(() => {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'location', label: 'Location' },
      { key: 'category', label: 'Category' },
      { key: 'tags', label: 'Tags' },
      { key: 'value', label: 'Value ($)' }
    ];

    return (
      <thead>
        <tr>
          {columns.map(col => (
            <th
              key={col.key}
              scope="col"
              onClick={() => handleSort(col.key)}
              onKeyDown={(e) => handleHeaderKeyDown(e, col.key)}
              tabIndex="0"
              aria-sort={sortColumn === col.key ? sortDirection : 'none'}
              style={{
                ...tableStyles.sortableHeader,
                ...(sortColumn === col.key ? tableStyles.sorted : {})
              }}
            >
              {col.label}
              {sortColumn === col.key && (
                <span style={tableStyles.sortIndicator} aria-hidden="true">
                  {sortDirection === 'asc' ? ' ▲' : ' ▼'}
                </span>
              )}
            </th>
          ))}
          <th scope="col">Actions</th>
        </tr>
      </thead>
    );
  }, [sortColumn, sortDirection, handleSort, handleHeaderKeyDown, tableStyles]);

  // Memoized row renderer for virtualization
  const Row = useCallback(({ index, style }) => {
    const item = sortedItems[index];
    const isItemLowStock = isLowStock(item, lowStockThreshold);
    const itemThreshold = item.lowStockThreshold ?? lowStockThreshold;

    return (
      <tr
        key={item.id}
        data-row-index={index}
        className={isItemLowStock ? 'low-stock' : ''}
        aria-labelledby={`item-name-${item.id}`}
        style={style}
      >
        <td
          style={editingCell?.itemId === item.id && editingCell?.field === 'name'
            ? tableStyles.editMode
            : tableStyles.editableCell}
          onDoubleClick={() => handleCellDoubleClick(item.id, 'name', item.name)}
        >
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
        </td>
        <td onDoubleClick={() => handleCellDoubleClick(item.id, 'quantity', item.quantity)}>
          {item.quantity}
          <span style={tableStyles.editIcon} aria-hidden="true">✎</span>
        </td>
        <td onDoubleClick={() => handleCellDoubleClick(item.id, 'location', item.location)}>
          {item.location || <span className="empty-value">–</span>}
          <span style={tableStyles.editIcon} aria-hidden="true">✎</span>
        </td>
        <td onDoubleClick={() => handleCellDoubleClick(item.id, 'category', item.category)}>
          {item.category || <span className="empty-value">–</span>}
          <span style={tableStyles.editIcon} aria-hidden="true">✎</span>
        </td>
        <td>
          {item.tags && item.tags.length > 0 ? (
            <span className="tag-list">{item.tags.join(', ')}</span>
          ) : (
            <span className="empty-value">–</span>
          )}
        </td>
        <td onDoubleClick={() => handleCellDoubleClick(item.id, 'value', item.value)}>
          {item.value !== undefined && item.value !== '' ? (
            <span className="item-value">${Number(item.value).toFixed(2)}</span>
          ) : (
            <span className="empty-value">–</span>
          )}
          <span style={tableStyles.editIcon} aria-hidden="true">✎</span>
        </td>
        <td>
          <div className="action-buttons">
            <button
              className="edit-button"
              onClick={() => onEdit && onEdit(item)}
              onKeyDown={(e) => handleTableKeyDown(e, item, index)}
              aria-label={`Edit ${item.name}`}
            >
              Edit
            </button>
            <button
              className="delete-button"
              onClick={() => onDelete && onDelete(item.id)}
              onKeyDown={(e) => handleTableKeyDown(e, item, index)}
              aria-label={`Delete ${item.name}`}
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    );
  }, [sortedItems, lowStockThreshold, editingCell, tableStyles, handleCellDoubleClick, handleTableKeyDown, onEdit, onDelete]);

  if (!items || items.length === 0) {
    return (
      <div className="empty-inventory" role="status" aria-live="polite">
        <h2>No Items Found</h2>
        <p>No items in inventory. Add some items to get started.</p>
      </div>
    );
  }

  if (filteredItems.length === 0 && items.length > 0) {
    return (
      <div className="no-results" role="status" aria-live="polite">
        <p>No items match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="inventory-table-container">
      {shouldVirtualize ? (
        // Virtualized rendering for large datasets
        <div>
          <table
            ref={tableRef}
            className="inventory-table"
            aria-label="Inventory"
            style={{ borderCollapse: 'collapse', width: '100%' }}
          >
            <caption className="sr-only">{caption}</caption>
            {TableHeader}
          </table>
          <List
            height={600}
            itemCount={sortedItems.length}
            itemSize={60}
            width="100%"
          >
            {Row}
          </List>
        </div>
      ) : (
        // Standard rendering for small datasets
        <table
          ref={tableRef}
          className="inventory-table"
          aria-label="Inventory"
          style={{ borderCollapse: 'collapse', width: '100%' }}
        >
          <caption className="sr-only">{caption}</caption>
          {TableHeader}
          <tbody>
            {sortedItems.map((item, index) => (
              <Row key={item.id} index={index} style={{}} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
});

export default InventoryTableOptimized;
