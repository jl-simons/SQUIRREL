import React, { useState,useRef } from 'react';

/**
 * SearchBar Component
 * Provides search and filtering functionality for inventory items.
 * 
 * Props:
 * - value: string - current search value
 * - onChange: function(value) - called when search input changes
 * - categories: array of strings - available categories for filtering
 * - locations: array of strings - available locations for filtering
 * - selectedCategory: string - currently selected category
 * - selectedLocation: string - currently selected location
 * - onCategoryChange: function(category) - called when category filter changes
 * - onLocationChange: function(location) - called when location filter changes
 * - onClear: function() - called when clear button is clicked
 * - tags: array of strings - available tags for filtering (optional)
 * - selectedTag: string - currently selected tag (optional)
 * - onTagChange: function(tag) - called when tag filter changes (optional)
 * - showLowStockFilter: boolean - whether to show low stock filter (optional)
 * - isLowStockOnly: boolean - whether low stock filter is active (optional)
 * - onLowStockChange: function(isLowStockOnly) - called when low stock filter changes (optional)
 */
export function SearchBar({
  value = '',
  onChange,
  categories = [],
  locations = [],
  selectedCategory = '',
  selectedLocation = '',
  onCategoryChange,
  onLocationChange,
  onClear,
  tags = [],
  selectedTag = '',
  onTagChange,
  showLowStockFilter = false,
  isLowStockOnly = false,
  onLowStockChange
}) {
  // Track if the search has focus for keyboard navigation
  const [hasFocus, setHasFocus] = useState(false);

  // Handle search input change
  const handleSearchChange = (e) => {
    onChange && onChange(e.target.value);
  };

  // Handle category filter change
  const handleCategoryChange = (e) => {
    onCategoryChange && onCategoryChange(e.target.value);
  };

  // Handle location filter change
  const handleLocationChange = (e) => {
    onLocationChange && onLocationChange(e.target.value);
  };

  // Handle tag filter change
  const handleTagChange = (e) => {
    onTagChange && onTagChange(e.target.value);
  };

  // Handle low stock filter change
  const handleLowStockChange = (e) => {
    onLowStockChange && onLowStockChange(e.target.checked);
  };

  // Handle clear button click
  const handleClear = () => {
    onChange && onChange('');
    onCategoryChange && onCategoryChange('');
    onLocationChange && onLocationChange('');
    onTagChange && onTagChange('');
    onLowStockChange && onLowStockChange(false);
    onClear && onClear();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    // If Escape key is pressed, clear the search
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div 
      className="search-bar" 
      role="search" 
      aria-label="Search inventory items"
    >
      <div className="search-input-container">
        <label htmlFor="search-input" className="sr-only">Search items</label>
        <input
          id="search-input"
          type="search"
          value={value}
          onChange={handleSearchChange}
          onFocus={() => setHasFocus(true)}
          onBlur={() => setHasFocus(false)}
          onKeyDown={handleKeyDown}
          placeholder="Search items..."
          aria-label="Search items"
          className="search-input"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="clear-button"
          >
            ×
          </button>
        )}
      </div>

      <div className="filter-controls" role="group" aria-label="Filter options">
        {categories.length > 0 && (
          <div className="filter-group">
            <label htmlFor="category-filter">Filter by category:</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={handleCategoryChange}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        )}

        {locations.length > 0 && (
          <div className="filter-group">
            <label htmlFor="location-filter">Filter by location:</label>
            <select
              id="location-filter"
              value={selectedLocation}
              onChange={handleLocationChange}
              aria-label="Filter by location"
            >
              <option value="">All locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        )}

        {tags.length > 0 && (
          <div className="filter-group">
            <label htmlFor="tag-filter">Filter by tag:</label>
            <select
              id="tag-filter"
              value={selectedTag}
              onChange={handleTagChange}
              aria-label="Filter by tag"
            >
              <option value="">All tags</option>
              {tags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        )}

        {showLowStockFilter && (
          <div className="filter-group checkbox-group">
            <input
              id="low-stock-filter"
              type="checkbox"
              checked={isLowStockOnly}
              onChange={handleLowStockChange}
              aria-label="Show only low stock items"
            />
            <label htmlFor="low-stock-filter">Low stock only</label>
          </div>
        )}
      </div>

      {(value || selectedCategory || selectedLocation || selectedTag || isLowStockOnly) && (
        <div className="active-filters" aria-live="polite">
          <span className="sr-only">Active filters:</span>
          <ul className="filter-tags" aria-label="Active filters">
            {value && (
              <li className="filter-tag">
                Search: {value}
                <button 
                  onClick={() => onChange && onChange('')}
                  aria-label={`Remove search filter: ${value}`}
                >
                  ×
                </button>
              </li>
            )}
            {selectedCategory && (
              <li className="filter-tag">
                Category: {selectedCategory}
                <button 
                  onClick={() => onCategoryChange && onCategoryChange('')}
                  aria-label={`Remove category filter: ${selectedCategory}`}
                >
                  ×
                </button>
              </li>
            )}
            {selectedLocation && (
              <li className="filter-tag">
                Location: {selectedLocation}
                <button 
                  onClick={() => onLocationChange && onLocationChange('')}
                  aria-label={`Remove location filter: ${selectedLocation}`}
                >
                  ×
                </button>
              </li>
            )}
            {selectedTag && (
              <li className="filter-tag">
                Tag: {selectedTag}
                <button 
                  onClick={() => onTagChange && onTagChange('')}
                  aria-label={`Remove tag filter: ${selectedTag}`}
                >
                  ×
                </button>
              </li>
            )}
            {isLowStockOnly && (
              <li className="filter-tag">
                Low stock only
                <button 
                  onClick={() => onLowStockChange && onLowStockChange(false)}
                  aria-label="Remove low stock filter"
                >
                  ×
                </button>
              </li>
            )}
          </ul>
          <button 
            className="clear-all-button"
            onClick={handleClear}
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * AutocompleteSearchBar Component
 * Provides a search input with autocomplete suggestions.
 * 
 * Props:
 * - value: string - current search value
 * - onChange: function(value) - called when search input changes
 * - suggestions: array of strings - available autocomplete suggestions
 */
export function AutocompleteSearchBar({ value, onChange, suggestions = [] }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef();
  const listboxId = "autocomplete-listbox";
  const inputId = "autocomplete-input";

  // Filtered suggestions (case-insensitive)
  const filtered = value
      ? suggestions.filter(name =>
          name.toLowerCase().includes(value.toLowerCase())
      )
      : [];

  function handleInput(e) {
    onChange && onChange(e.target.value);
    setShowSuggestions(true);
    setActiveIndex(-1);
  }

  function handleSuggestionClick(name) {
    onChange && onChange(name);
    setShowSuggestions(false);
    setActiveIndex(-1);
    inputRef.current.blur();
  }

  function handleKeyDown(e) {
    if (!showSuggestions || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i <= 0 ? filtered.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }

  function handleBlur() {
    setTimeout(() => setShowSuggestions(false), 100); // Delay so click works
  }

  return (
      <div 
        style={{ position: "relative", width: "100%", maxWidth: 400 }}
        role="search"
        aria-label="Search with autocomplete"
      >
        <label htmlFor={inputId} className="sr-only">Search items</label>
        <input
            id={inputId}
            ref={inputRef}
            type="search"
            placeholder="Search items..."
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={handleBlur}
            aria-label="Search items"
            aria-autocomplete="list"
            aria-controls={showSuggestions && filtered.length > 0 ? listboxId : undefined}
            aria-activedescendant={activeIndex >= 0 ? `option-${activeIndex}` : undefined}
            aria-expanded={showSuggestions && filtered.length > 0}
            autoComplete="off"
        />
        {showSuggestions && filtered.length > 0 && (
            <ul
                id={listboxId}
                className="autocomplete-dropdown"
                style={{
                  position: "absolute",
                  left: 0, right: 0, top: "100%",
                  background: "#fff",
                  border: "1px solid #ccc",
                  zIndex: 10,
                  margin: 0, padding: 0, listStyle: "none",
                  maxHeight: 180, overflowY: "auto"
                }}
                role="listbox"
                aria-label="Search suggestions"
            >
              {filtered.map((name, i) => (
                  <li
                      id={`option-${i}`}
                      key={name}
                      role="option"
                      aria-selected={i === activeIndex}
                      onMouseDown={() => handleSuggestionClick(name)}
                      style={{
                        padding: "0.5em 1em",
                        background: i === activeIndex ? "#e0e7ff" : "#fff",
                        cursor: "pointer"
                      }}
                  >
                    {name}
                  </li>
              ))}
            </ul>
        )}
      </div>
  );
}

// Default export for backward compatibility
export default SearchBar;
