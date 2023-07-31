module.exports = {
  testEnvironment: 'node',
  verbose: true,
  setupFilesAfterEnv: ['./test/jest.setup.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    './index.js'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/templates/'
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      lines: 100,
      statements: 100
    }
  }
}
