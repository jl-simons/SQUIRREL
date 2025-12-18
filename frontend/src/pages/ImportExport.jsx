import React, { useState } from 'react';
import NotificationBar from '../components/NotificationBar';
import { exportToCSV, importFromCSV, validateCSV } from '../utils/csvUtils';
import { getInventory, setInventory } from '../utils/inventoryStorage';
import { createNotification, NOTIFICATION_TYPES } from '../utils/notificationUtils';

/**
 * ImportExport Page Component
 * 
 * Provides functionality for importing and exporting inventory data in CSV format.
 * Includes validation and error handling for imported data.
 */
const ImportExport = () => {
  const [notifications, setNotifications] = useState([]);
  const [csvData, setCsvData] = useState('');

  const handleExport = () => {
    try {
      // Get current inventory
      const inventory = getInventory();

      // Convert to CSV
      const csvData = exportToCSV(inventory);

      // Create a download link
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);

      // Trigger download
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success notification
      setNotifications(prev => [
        ...prev,
        createNotification('Inventory exported successfully!', NOTIFICATION_TYPES.SUCCESS)
      ]);
    } catch (error) {
      console.error('Export error:', error);
      setNotifications(prev => [
        ...prev,
        createNotification(`Export failed: ${error.message}`, NOTIFICATION_TYPES.ERROR)
      ]);
    }
  };

  const handleImport = () => {
    try {
      // Validate CSV data
      if (!csvData.trim()) {
        setNotifications(prev => [
          ...prev,
          createNotification('Please paste CSV data first', NOTIFICATION_TYPES.WARNING)
        ]);
        return;
      }

      if (!validateCSV(csvData)) {
        setNotifications(prev => [
          ...prev,
          createNotification('Invalid CSV format. Please check your data and try again.', NOTIFICATION_TYPES.ERROR)
        ]);
        return;
      }

      // Parse CSV data
      const importedItems = importFromCSV(csvData);

      // Save to storage
      setInventory(importedItems);

      // Show success notification
      setNotifications(prev => [
        ...prev,
        createNotification(`Successfully imported ${importedItems.length} items!`, NOTIFICATION_TYPES.SUCCESS)
      ]);

      // Clear the textarea
      setCsvData('');
    } catch (error) {
      console.error('Import error:', error);
      setNotifications(prev => [
        ...prev,
        createNotification(`Import failed: ${error.message}`, NOTIFICATION_TYPES.ERROR)
      ]);
    }
  };

  const handleCsvChange = (e) => {
    setCsvData(e.target.value);
  };

  return (
    <div className="import-export-page">
      <h1>Import/Export Data</h1>

      {/* Display notifications */}
      {notifications.length > 0 && notifications.map(notification => (
        <NotificationBar 
          key={notification.id}
          message={notification.message} 
          type={notification.type}
          duration={notification.duration}
          onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))} 
        />
      ))}

      <div className="export-section">
        <h2>Export Inventory</h2>
        <p>Download your inventory data as a CSV file.</p>
        <button onClick={handleExport}>Export to CSV</button>
      </div>

      <div className="import-section">
        <h2>Import Inventory</h2>
        <p>Paste CSV data below to import into your inventory.</p>
        <textarea 
          value={csvData}
          onChange={handleCsvChange}
          placeholder="Paste CSV data here..."
          rows={10}
          cols={50}
        />
        <button onClick={handleImport}>Import from CSV</button>
      </div>
    </div>
  );
};

export default ImportExport;
