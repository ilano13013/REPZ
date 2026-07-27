/**
 * Configuration Jest.
 *
 * Les moteurs (`src/engines`) sont volontairement des fonctions pures sans
 * dépendance React Native : ils sont testés avec ts-jest dans un environnement
 * Node pur, ce qui rend la suite rapide et exécutable sans toolchain natif.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          strict: true,
          esModuleInterop: true,
          resolveJsonModule: true,
        },
      },
    ],
  },
};
