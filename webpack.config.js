/* eslint-env node */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const HtmlWebpackPlugin = require('html-webpack-plugin');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// import { type Configuration } from 'webpack';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CopyWebpackPlugin = require('copy-webpack-plugin');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ClosureWebpackPlugin = require('closure-webpack-plugin');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

// has to be a JS file so TS doesn't have a fit with the imports
// TODO: perhaps could be overcome by having a separate tsconfig.json in the src folder?
// @ts-check
/** @type {ClosurePlugin} */
const config = {
  target: 'web',
  entry: './src/index.ts',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/i,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|gif|bmp)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            },
          },
        ],
      },
    ],
  },
  resolve: {
    plugins: [new TsconfigPathsPlugin()],
    extensions: [
      '.tsx',
      '.ts',
      '.js',
    ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/webpack'),
    // this does nothing when combined with the closure plugin :(
    iife: false,
  },
  optimization: {
    minimizer: [
      new ClosureWebpackPlugin({
        mode: 'STANDARD',
        // more fully-featured? Also doesn't work
        // platform: 'java',
      }, {
        externs: path.resolve(__dirname, 'externs.js'),
        compilation_level: 'ADVANCED',
        module_resolution: 'WEBPACK',
      }),
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'assets/index.html',
      scriptLoading: 'blocking',
      minify: {
        collapseWhitespace: true,
        keepClosingSlash: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        removeOptionalTags: true,
        removeAttributeQuotes: true,
      },
    }),
    new ReplaceInFileWebpackPlugin([
      {
        dir: path.resolve(__dirname, 'dist/webpack'),
        files: ['bundle.js'],
        rules: [
          // remove iife start
          {
            search: /^\(function\(\)\{/g,
            replace: '',
          },
          // remove iife end
          {
            search: /;\}\)\.call\(this \|\| window\)\n$/,
            replace: '',
          },
        ],
      },
    ]),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './assets/c.png',
          to: 'c.png',
        },
        {
          from: './assets/b.bmp',
          to: 'b.bmp',
        },
      ],
    }),
    // new HtmlInlineScriptPlugin(),
  ],
};

module.exports = config;
