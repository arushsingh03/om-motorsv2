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
            "@": "./src", 
          },
        },
      ],
      "react-native-reanimated/plugin", 
    ],
  };
};
