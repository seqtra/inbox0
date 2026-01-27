/* eslint-disable */
const path = require('path');

module.exports = {
  displayName: '@email-whatsapp-bridge/api',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', { jsc: { target: 'es2022' } }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/api',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  moduleNameMapper: {
    '^@email-whatsapp-bridge/shared$': path.join(__dirname, '..', 'libs', 'shared', 'src', 'index.ts'),
  },
};
