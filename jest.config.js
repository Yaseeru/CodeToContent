module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     roots: ['<rootDir>/lib'],
     testMatch: ['**/__tests__/**/*.test.ts'],
     collectCoverageFrom: [
          'lib/**/*.ts',
          '!lib/**/*.d.ts',
     ],
     moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
     globals: {
          'ts-jest': {
               isolatedModules: true,
          },
     },
};
