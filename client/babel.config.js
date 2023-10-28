module.exports = {
  presets: [
    ["@babel/preset-env", { targets: "last 2 versions, not dead, > 0.2%" }],
    "@babel/preset-react", // If you're using React
  ],
  plugins: [
    ["babel-plugin-root-import", {
      rootPathSuffix: "./",
      rootPathPrefix: "@src"
    }]
  ]
};
