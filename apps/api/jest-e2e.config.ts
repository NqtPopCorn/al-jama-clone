import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testEnvironment: 'node',
  testTimeout: 60000,
  moduleNameMapper: {
    '^@aljama/shared$': '<rootDir>/../../packages/shared/dist',
  },
};

export default config;
