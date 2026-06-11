import type { Config } from 'jest';
import nextJest from 'next/jest.js';

// next/jest configura automaticamente el transform (SWC), el manejo de CSS,
// las variables de entorno (.env) y el soporte para el App Router de Next.js.
const createJestConfig = nextJest({
  dir: './'
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Resolucion del alias "@/..." definido en tsconfig.json
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],

  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],

  // Cobertura: medimos el codigo de la aplicacion (excluyendo tipos y archivos
  // que no aportan logica testeable como layouts y estilos).
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/layout.tsx',
    '!src/app/globals.css'
  ]
};

export default createJestConfig(config);
