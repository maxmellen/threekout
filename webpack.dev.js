let path = require("path");

let srcPath = path.resolve(__dirname, "src");
let distPath = path.resolve(__dirname, "docs");

module.exports = {
  mode: "development",
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
        test: /\.(vert|frag)$/,
        use: "raw-loader",
        include: srcPath,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  devtool: "inline-source-map",
  devServer: {
    contentBase: distPath,
  },
};
