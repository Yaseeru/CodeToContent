import '@testing-library/jest-dom';

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
     writable: true,
     value: jest.fn().mockImplementation(query => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
     })),
});

// Mock localStorage
const localStorageMock = (() => {
     let store: Record<string, string> = {};
     return {
          getItem: jest.fn((key: string) => store[key] || null),
          setItem: jest.fn((key: string, value: string) => {
               store[key] = value;
          }),
          removeItem: jest.fn((key: string) => {
               delete store[key];
          }),
          clear: jest.fn(() => {
               store = {};
          }),
     };
})();
global.localStorage = localStorageMock as any;
