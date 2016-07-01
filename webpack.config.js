var webpack = require("webpack");

var output = {
  filename: "web-reader.js",
  library: "WebReader",
  libraryTarget: "umd"
};

if (process.env.NODE_ENV === "production") {
  Object.assign(output, { path: "./dist/js" });
} else {
  Object.assign(output, { publicPath: "http://localhost:8090/js" });
}

var config = {
  entry: {
    app: [
      "./src/index.ts",
    ],
  },
  output: output,
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