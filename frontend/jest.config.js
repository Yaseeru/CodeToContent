module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'jsdom',
     roots: ['<rootDir>/src'],
     testMatch: ['**/__tests__/**/*.test.tsx', '**/__tests__/**/*.test.ts'],
     collectCoverageFrom: [
          'src/**/*.{ts,tsx}',
          '!src/**/*.test.{ts,tsx}',
          '!src/**/__tests__/**'
     ],
     moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
     transform: {
          '^.+\\.tsx?$': 'ts-jest'
     },
     setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
     moduleNameMapper: {
          '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
     }
};
