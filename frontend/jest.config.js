module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/tests/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/tests/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/tests/**',
    '!src/**/*.test.{js,jsx}',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx}'],
};
