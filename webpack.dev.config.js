var webpack = require("webpack");

var config = {
  entry: {
    app: [
      "./src/index.ts",
    ],
  },
  output: {
    filename: "pagination.js",
    publicPath: "http://localhost:8090/js",
    library: "Pages",
    libraryTarget: "umd"
  },
  plugins: [
    new webpack.DefinePlugin({ "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV) })
  ],
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        loaders: [
          "ts-loader"
        ]
      }
    ],
  },
  resolve: {
    extensions: ["", ".webpack.js", ".web.js", ".js", ".ts"]
  }
};

module.exports = config;