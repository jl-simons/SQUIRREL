import React, { useState, useEffect, useRef } from 'react';

/**
 * Inventory Item Form
 * Handles both add and edit modes.
 *
 * Props:
 * - initialItem: InventoryItem or null (for editing)
 * - onSubmit: function (called with completed item object)
 * - onCancel: function (optional, called if cancel is pressed)
 */

// Simple UUID generator (replace with better method if desired)
function uuid() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
}

const DEFAULTS = {
    quantity: 1,
    lowStockThreshold: 2,
    category: '',
    tags: [],
    value: ''
};

export default function ItemForm({ initialItem = null, onSubmit, onCancel }) {
    const [item, setItem] = useState(() =>
        initialItem
            ? { ...DEFAULTS, ...initialItem }
            : { ...DEFAULTS, name: '', location: '' }
    );

    const [errors, setErrors] = useState({});
    const nameRef = useRef();

    // Autofocus first field
    useEffect(() => {
        nameRef.current && nameRef.current.focus();
    }, []);

    function validate(item) {
        const errs = {};
        if (!item.name.trim()) errs.name = 'Name is required';
        if (item.quantity === '' || isNaN(item.quantity) || Number(item.quantity) < 0)
            errs.quantity = 'Quantity must be a non-negative number';
        return errs;
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setItem((prev) => ({
            ...prev,
            [name]: name === 'quantity' || name === 'lowStockThreshold' || name === 'value'
                ? value === '' ? '' : Number(value)
                : value
        }));
    }

    function handleTagsChange(e) {
        setItem((prev) => ({
            ...prev,
            tags: e.target.value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag)
        }));
    }

    function handleSubmit(e) {
        e.preventDefault();
        const validationErrors = validate(item);
        setErrors(validationErrors);

        // If there are validation errors, don't submit the form
        if (Object.keys(validationErrors).length > 0) {
            // Force a re-render to ensure error messages are displayed
            setItem({...item});
            return;
        }

        const now = new Date().toISOString();
        const newItem = {
            ...item,
            id: item.id || uuid(),
            dateAdded: item.dateAdded || now,
            dateUpdated: now
        };
        onSubmit && onSubmit(newItem);
        // Optionally reset form or close modal after submit
    }

    return (
        <form className="item-form" onSubmit={handleSubmit} aria-label={initialItem ? 'Edit Item' : 'Add Item'}>
            <div>
                <label>
                    Name *
                    <input
                        ref={nameRef}
                        name="name"
                        value={item.name}
                        onChange={handleChange}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "itemform-name-error" : undefined}
                        required
                    />
                </label>
                {errors.name && <span id="itemform-name-error" className="error">{errors.name}</span>}
            </div>

            <div>
                <label>
                    Quantity *
                    <input
                        name="quantity"
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={handleChange}
                        aria-invalid={!!errors.quantity}
                        aria-describedby={errors.quantity ? "itemform-quantity-error" : undefined}
                        required
                    />
                </label>
                {errors.quantity && <span id="itemform-quantity-error" className="error">{errors.quantity}</span>}
            </div>

            <div>
                <label>
                    Location
                    <input
                        name="location"
                        value={item.location}
                        onChange={handleChange}
                    />
                </label>
            </div>

            <div>
                <label>
                    Category
                    <select
                        name="category"
                        value={item.category}
                        onChange={handleChange}
                    >
                        <option value="">(none)</option>
                        <option value="Food">Food</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Electronics">Electronics</option>
                    </select>
                </label>
            </div>

            <div>
                <label>
                    Tags
                    <input
                        name="tags"
                        value={item.tags.join(', ')}
                        onChange={handleTagsChange}
                        placeholder="e.g. perishable, urgent"
                    />
                </label>
            </div>

            <div>
                <label>
                    Low-stock threshold
                    <input
                        name="lowStockThreshold"
                        type="number"
                        min={0}
                        value={item.lowStockThreshold}
                        onChange={handleChange}
                    />
                </label>
            </div>

            <div>
                <label>
                    Value ($)
                    <input
                        name="value"
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.value}
                        onChange={handleChange}
                    />
                </label>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="submit">{initialItem ? 'Save' : 'Add Item'}</button>
                {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
            </div>
        </form>
    );
}
