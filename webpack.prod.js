let path = require("path");
let HtmlWebpackPlugin = require("html-webpack-plugin");

let srcPath = path.resolve(__dirname, "src");
let distPath = path.resolve(__dirname, "docs");

module.exports = {
  mode: "production",
  entry: "./src/main.ts",
  output: { path: distPath },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        include: srcPath,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
        include: srcPath,
      },
      {
        test: /\.(vert|frag)$/,
        use: "raw-loader",
        include: srcPath,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html",
    }),
  ],
};
