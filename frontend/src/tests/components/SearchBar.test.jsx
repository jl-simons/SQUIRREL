import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../../components/SearchBar';

describe('SearchBar', () => {
  // Basic functionality tests
  it('renders search input and triggers onChange', () => {
    const handleChange = jest.fn();
    render(<SearchBar value="" onChange={handleChange} />);

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'milk' } });

    expect(handleChange).toHaveBeenCalledWith('milk');
  });

  it('renders category and location filters when provided', () => {
    render(
      <SearchBar
        value=""
        onChange={() => {}}
        categories={['Food', 'Cleaning']}
        locations={['Fridge', 'Pantry']}
        selectedCategory=""
        selectedLocation=""
        onCategoryChange={() => {}}
        onLocationChange={() => {}}
      />
    );

    expect(screen.getByLabelText(/filter by category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by location/i)).toBeInTheDocument();
  });

  it('calls onCategoryChange and onLocationChange when filters change', () => {
    const onCategoryChange = jest.fn();
    const onLocationChange = jest.fn();

    render(
      <SearchBar
        value=""
        onChange={() => {}}
        categories={['Food']}
        locations={['Pantry']}
        selectedCategory=""
        selectedLocation=""
        onCategoryChange={onCategoryChange}
        onLocationChange={onLocationChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/filter by category/i), { target: { value: 'Food' } });
    fireEvent.change(screen.getByLabelText(/filter by location/i), { target: { value: 'Pantry' } });

    expect(onCategoryChange).toHaveBeenCalledWith('Food');
    expect(onLocationChange).toHaveBeenCalledWith('Pantry');
  });

  it('clear button resets filters and search', () => {
    const onChange = jest.fn();
    const onCategoryChange = jest.fn();
    const onLocationChange = jest.fn();
    const onClear = jest.fn();

    render(
      <SearchBar
        value="battery"
        onChange={onChange}
        categories={['Electronics']}
        locations={['Garage']}
        selectedCategory="Electronics"
        selectedLocation="Garage"
        onCategoryChange={onCategoryChange}
        onLocationChange={onLocationChange}
        onClear={onClear}
      />
    );

    fireEvent.click(screen.getByLabelText(/clear search/i));

    expect(onChange).toHaveBeenCalledWith('');
    expect(onCategoryChange).toHaveBeenCalledWith('');
    expect(onLocationChange).toHaveBeenCalledWith('');
    expect(onClear).toHaveBeenCalled();
  });

  // Accessibility tests
  it('has proper accessibility attributes', () => {
    render(<SearchBar value="" onChange={() => {}} />);

    // Check search container has proper role
    const searchContainer = screen.getByRole('search');
    expect(searchContainer).toBeInTheDocument();
    expect(searchContainer).toHaveAttribute('aria-label', 'Search inventory items');

    // Check search input has proper attributes
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveAttribute('aria-label', 'Search items');
    expect(searchInput).toHaveAttribute('id', 'search-input');

    // Check label is properly associated with input
    const label = screen.getByText('Search items');
    expect(label).toHaveAttribute('for', 'search-input');
  });

  // Keyboard navigation tests
  it('supports keyboard navigation and escape key to clear', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar value="test" onChange={onChange} />);

    const searchInput = screen.getByRole('searchbox');
    await user.click(searchInput);
    await user.keyboard('{Escape}');

    expect(onChange).toHaveBeenCalledWith('');
  });

  // Future filter support tests
  it('renders tag filter when tags are provided', () => {
    render(
      <SearchBar
        value=""
        onChange={() => {}}
        tags={['Perishable', 'Urgent']}
        selectedTag=""
        onTagChange={() => {}}
      />
    );

    expect(screen.getByLabelText(/filter by tag/i)).toBeInTheDocument();
  });

  it('renders low stock filter when showLowStockFilter is true', () => {
    render(
      <SearchBar
        value=""
        onChange={() => {}}
        showLowStockFilter={true}
        isLowStockOnly={false}
        onLowStockChange={() => {}}
      />
    );

    expect(screen.getByLabelText(/show only low stock items/i)).toBeInTheDocument();
  });

  it('displays active filters with remove buttons', () => {
    render(
      <SearchBar
        value="test"
        onChange={() => {}}
        selectedCategory="Food"
        onCategoryChange={() => {}}
        selectedLocation="Pantry"
        onLocationChange={() => {}}
      />
    );

    // Check active filters section exists
    const activeFilters = screen.getByText(/search: test/i).closest('div');
    expect(activeFilters).toHaveAttribute('aria-live', 'polite');

    // Check individual filter tags
    expect(screen.getByText(/search: test/i)).toBeInTheDocument();
    expect(screen.getByText(/category: food/i)).toBeInTheDocument();
    expect(screen.getByText(/location: pantry/i)).toBeInTheDocument();

    // Check remove buttons
    expect(screen.getByLabelText(/remove search filter: test/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remove category filter: food/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remove location filter: pantry/i)).toBeInTheDocument();
  });

  it('clear all button removes all active filters', () => {
    const onChange = jest.fn();
    const onCategoryChange = jest.fn();
    const onLocationChange = jest.fn();

    render(
      <SearchBar
        value="test"
        onChange={onChange}
        selectedCategory="Food"
        onCategoryChange={onCategoryChange}
        selectedLocation="Pantry"
        onLocationChange={onLocationChange}
      />
    );

    fireEvent.click(screen.getByLabelText(/clear all filters/i));

    expect(onChange).toHaveBeenCalledWith('');
    expect(onCategoryChange).toHaveBeenCalledWith('');
    expect(onLocationChange).toHaveBeenCalledWith('');
  });
});
