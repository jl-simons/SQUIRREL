import React from 'react';
import { render, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InventoryTable from '../../components/InventoryTable';

const mockItems = [
  { id: '1', name: 'Milk', quantity: 1, location: 'Fridge', category: 'Food', tags: ['perishable'], value: 2.99, lowStockThreshold: 2 },
  { id: '2', name: 'Soap', quantity: 5, location: 'Bathroom', category: 'Cleaning', tags: [], value: 1.49 },
  { id: '3', name: 'Batteries', quantity: 0, location: '', category: 'Electronics', tags: ['essential'], value: 4.99 },
];

describe('InventoryTable', () => {
  // Basic functionality tests
  it('renders items and low-stock warning', () => {
    render(<InventoryTable items={mockItems} />);

    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('Soap')).toBeInTheDocument();

    // Check for low stock indicator
    const lowStockIndicators = screen.getAllByRole('img', { name: /low stock warning/i });
    expect(lowStockIndicators.length).toBeGreaterThan(0);
    expect(lowStockIndicators[0]).toHaveAttribute('aria-label', expect.stringContaining('threshold is 2'));
  });

  it('calls onEdit and onDelete when buttons are clicked', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(<InventoryTable items={mockItems} onEdit={onEdit} onDelete={onDelete} />);

    // Click the edit button for the first item
    fireEvent.click(screen.getByLabelText('Edit Milk'));
    expect(onEdit).toHaveBeenCalledWith(mockItems[0]);

    // Click the delete button for the second item
    fireEvent.click(screen.getByLabelText('Delete Soap'));
    expect(onDelete).toHaveBeenCalledWith(mockItems[1].id);
  });

  it('shows "No Items Found" message if items array is empty', () => {
    render(<InventoryTable items={[]} />);

    expect(screen.getByRole('heading', { name: /no items found/i })).toBeInTheDocument();
    expect(screen.getByText(/no items in inventory/i)).toBeInTheDocument();
  });

  it('filters items with a filter prop', () => {
    render(<InventoryTable items={mockItems} filter={item => item.category === 'Food'} />);

    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.queryByText('Soap')).toBeNull();
    expect(screen.queryByText('Batteries')).toBeNull();
  });

  it('shows "No items match your current filters" when filter returns no results', () => {
    render(<InventoryTable items={mockItems} filter={() => false} />);

    expect(screen.getByText(/no items match your current filters/i)).toBeInTheDocument();
  });

  // Table structure and accessibility tests
  it('has proper table structure with accessible elements', () => {
    render(<InventoryTable items={mockItems} />);

    // Check table has proper structure
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', 'Inventory');

    // Check for caption
    expect(table.querySelector('caption')).toBeInTheDocument();

    // Check column headers have scope attribute
    const headers = screen.getAllByRole('columnheader');
    headers.forEach(header => {
      expect(header).toHaveAttribute('scope', 'col');
    });

    // Check expected headers are present
    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /quantity/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /location/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /category/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /tags/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /value/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
  });

  it('renders empty values with accessible placeholders', () => {
    render(<InventoryTable items={mockItems} />);

    // Find the row for the item with empty location
    const batteryRow = screen.getByText('Batteries').closest('tr');

    // Check that the empty location cell has an accessible label
    const locationCell = within(batteryRow).getByLabelText('No location specified');
    expect(locationCell).toBeInTheDocument();
    expect(locationCell).toHaveTextContent('–');
  });

  it('formats currency values correctly', () => {
    render(<InventoryTable items={mockItems} />);

    // Check that the value is formatted as currency
    expect(screen.getByText('$2.99')).toBeInTheDocument();
    expect(screen.getByText('$1.49')).toBeInTheDocument();
    expect(screen.getByText('$4.99')).toBeInTheDocument();
  });

  it('displays tags correctly', () => {
    render(<InventoryTable items={mockItems} />);

    // Check that tags are displayed
    expect(screen.getByText('perishable')).toBeInTheDocument();
    expect(screen.getByText('essential')).toBeInTheDocument();

    // Check that empty tags have an accessible label
    const soapRow = screen.getByText('Soap').closest('tr');
    const tagsCell = within(soapRow).getByLabelText('No tags specified');
    expect(tagsCell).toBeInTheDocument();
  });

  // Keyboard navigation tests
  it('supports keyboard navigation between rows', async () => {
    const onEdit = jest.fn();
    const user = userEvent.setup();
    const { getByTestId } = render(<InventoryTable items={mockItems} onEdit={onEdit} />);

    // Get the first edit button and focus it
    const firstEditButton = getByTestId('edit-button-0');
    firstEditButton.focus();

    // Simulate clicking the first edit button
    await user.click(firstEditButton);
    expect(onEdit).toHaveBeenCalledWith(mockItems[0]);

    // Reset the mock
    onEdit.mockClear();

    // Get the second edit button and focus it
    const secondEditButton = getByTestId('edit-button-1');
    secondEditButton.focus();

    // Simulate clicking the second edit button
    await user.click(secondEditButton);
    expect(onEdit).toHaveBeenCalledWith(mockItems[1]);
  });

  it('supports keyboard activation of buttons', async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const user = userEvent.setup();
    const { getByTestId } = render(<InventoryTable items={mockItems} onEdit={onEdit} onDelete={onDelete} />);

    // Get the first edit button and focus it
    const editButton = getByTestId('edit-button-0');
    editButton.focus();

    // Simulate pressing Enter on the edit button
    await user.keyboard('{Enter}');
    expect(onEdit).toHaveBeenCalledWith(mockItems[0]);

    // Get the first delete button and focus it
    const deleteButton = getByTestId('delete-button-0');
    deleteButton.focus();

    // Simulate pressing Space on the delete button
    await user.keyboard(' ');
    expect(onDelete).toHaveBeenCalledWith(mockItems[0].id);
  });

  // Custom props tests
  it('respects custom lowStockThreshold prop', () => {
    render(<InventoryTable items={mockItems} lowStockThreshold={6} />);

    // All three items should show low stock warnings (Milk: 1, Soap: 5, Batteries: 0)
    const lowStockIndicators = screen.getAllByRole('img', { name: /low stock warning/i });
    expect(lowStockIndicators).toHaveLength(3);

    // Check that the thresholds are mentioned in the aria-labels
    expect(lowStockIndicators[0]).toHaveAttribute('aria-label', expect.stringContaining('threshold is 2')); // Milk's custom threshold
    expect(lowStockIndicators[1]).toHaveAttribute('aria-label', expect.stringContaining('threshold is 6')); // Soap with global threshold
    expect(lowStockIndicators[2]).toHaveAttribute('aria-label', expect.stringContaining('threshold is 6')); // Batteries with global threshold
  });

  it('accepts custom caption prop', () => {
    const customCaption = 'Custom inventory table caption';
    render(<InventoryTable items={mockItems} caption={customCaption} />);

    const caption = screen.getByText(customCaption);
    expect(caption).toBeInTheDocument();
    expect(caption.tagName.toLowerCase()).toBe('caption');
  });
});
