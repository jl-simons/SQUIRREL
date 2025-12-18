// Import Jest DOM extensions
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn(index => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// Mock browser notifications
global.Notification = jest.fn(() => ({
  close: jest.fn()
}));
Notification.permission = 'granted';
Notification.requestPermission = jest.fn(() => Promise.resolve('granted'));

// Assign mocks to global object
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Suppress console errors during tests
console.error = jest.fn();