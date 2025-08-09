/* eslint-env node */
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("node:path");
// import { type Configuration } from 'webpack';
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ClosureWebpackPlugin = require("closure-webpack-plugin");
const ReplaceInFileWebpackPlugin = require("replace-in-file-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

// has to be a JS file so TS doesn't have a fit with the imports
// TODO: perhaps could be overcome by having a separate tsconfig.json in the src folder?
// @ts-check
/** @type {ClosurePlugin} */
const config = {
  devtool: "source-map",
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.tsx?$/i,
        use: "ts-loader",
      },
      {
        test: /\.(png|jpg|gif|bmp)$/i,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 8192,
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimizer: [
      new ClosureWebpackPlugin(
        {
          mode: "STANDARD",
          // more fully-featured? Also doesn't work
          // platform: 'java',
        },
        {
          compilation_level: "ADVANCED",
          externs: path.resolve(__dirname, "externs.js"),
          module_resolution: "WEBPACK",
        },
      ),
    ],
  },
  output: {
    filename: "bundle.js",
    // this does nothing when combined with the closure plugin :(
    iife: false,
    path: path.resolve(__dirname, "dist/webpack"),
  },
  plugins: [
    new HtmlWebpackPlugin({
      minify: {
        collapseWhitespace: true,
        keepClosingSlash: true,
        minifyCSS: true,
        removeAttributeQuotes: true,
        removeComments: true,
        removeOptionalTags: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
      scriptLoading: "blocking",
      template: "assets/index.html",
    }),
    new ReplaceInFileWebpackPlugin([
      {
        dir: path.resolve(__dirname, "dist/webpack"),
        files: ["bundle.js"],
        rules: [
          // remove iife start
          {
            replace: "",
            search: /^\(function\(\)\{/g,
          },
          // remove iife end
          {
            replace: "",
            search: /;\}\)\.call\(this \|\| window\)\n$/,
          },
        ],
      },
    ]),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "./assets/c.png",
          to: "c.png",
        },
        {
          from: "./assets/b.bmp",
          to: "b.bmp",
        },
      ],
    }),
    // new HtmlInlineScriptPlugin(),
  ],
  resolve: {
    alias: {
      shaders: path.resolve(__dirname, "gen/shaders"),
    },
    extensions: [".tsx", ".ts", ".js"],
    plugins: [new TsconfigPathsPlugin()],
  },
  target: "web",
};

module.exports = config;
