module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "@babel/plugin-proposal-export-namespace-from",
      "@babel/plugin-transform-runtime",
      "module:react-native-dotenv",
      [
        "module-resolver",
        {
          alias: {
            "@": "./src", // Adjust the alias path based on your project structure
          },
        },
      ],
      "react-native-reanimated/plugin", // Must be listed last
    ],
  };
};
