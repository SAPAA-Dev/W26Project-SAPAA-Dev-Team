import type { Config } from 'jest';

// macOS Finder copies ("page 2.tsx", "route.test 2.ts") are untracked duplicates. Never run,
// resolve or measure them.
const finderCopy = ' [0-9]+\\.(test\\.)?[jt]sx?$';

const config: Config = {
  preset: 'ts-jest',                        // <-- use ts-jest for TypeScript
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',               // <-- transform TS/TSX files
  },
  moduleNameMapper: {
    // Must precede the '@/' catch-all. The real module uses import.meta, which CommonJS rejects.
    '^@/components/map/enableMapLibreWorker$': '<rootDir>/__mocks__/enableMapLibreWorker.ts',
    // Next resolves 'server-only' to its own copy, so Jest uses the empty server build of it.
    '^server-only$': '<rootDir>/node_modules/next/dist/compiled/server-only/empty.js',
    '^@/(.*)$': '<rootDir>/$1',             // map @/ imports to root
    '\\.(css|scss|sass)$': 'identity-obj-proxy', // optional for CSS modules
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.ts',
    '^react-markdown$': '<rootDir>/__mocks__/react-markdown.tsx',
    '^remark-gfm$': '<rootDir>/__mocks__/remark-gfm.ts',
    '^rehype-raw$': '<rootDir>/__mocks__/rehype-raw.ts',
    '^@aws-sdk/client-s3$': '<rootDir>/__mocks__/aws-sdk-client-s3.ts',
    '^@aws-sdk/s3-request-presigner$': '<rootDir>/__mocks__/aws-sdk-s3-request-presigner.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', finderCopy],
  modulePathIgnorePatterns: ['/.next/', finderCopy],
  coveragePathIgnorePatterns: ['/node_modules/', '/.next/', finderCopy],
  // Measured on 2026-10-11 with all Sprint 2 fixes: statements 84.26, branches 73.38,
  // functions 78.28, lines 86.77. Set about 1 to 2 points below, so a drop fails the run
  // without random failures.
  coverageThreshold: {
    global: { statements: 83, branches: 72, functions: 77, lines: 85 },
  },
};

export default config;
