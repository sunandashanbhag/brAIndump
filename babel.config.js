module.exports = function (api) {
  const isTest = process.env.NODE_ENV === "test";
  api.cache(!isTest);
  // When running in Jest, use a minimal transform that avoids RN-specific plugins
  if (isTest) {
    return {
      presets: [
        ["@babel/preset-typescript"],
        ["@babel/preset-react"],
      ],
      plugins: [
        ["@babel/plugin-transform-modules-commonjs"],
      ],
    };
  }
  return {
    presets: ["expo/internal/babel-preset"],
  };
};
