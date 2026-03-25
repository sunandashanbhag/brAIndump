/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  preset: undefined,
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(zustand)/)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};

module.exports = config;
