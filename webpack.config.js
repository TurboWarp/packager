require('./src/build/make-worker-loader-always-inline');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  entry: {
    scaffolding: './src/scaffolding/export.js',
    addons: './src/addons/index.js',
    packager: './src/packager/index.js'
  },
  resolve: {
    alias: {
      svelte: path.resolve('node_modules', 'svelte'),
      'text-encoding$': 'fastestsmallesttextencoderdecoder',
      'scratch-translate-extension-languages$': path.resolve(__dirname, 'src', 'scaffolding', 'scratch-translate-extension-languages', 'languages.json')
    },
    extensions: ['.mjs', '.js', '.svelte'],
    mainFields: ['svelte', 'browser', 'module', 'main']
  },
  module: {
    rules: [
      {
        test: /\.(mp3|svg|png)$/i,
        include: /node_modules|addons/,
        use: [
          {
            loader: 'url-loader',
            options: {
              esModule: false
            }
          }
        ]
      },
      {
        test: /\.png$/i,
        include: /src[\/\\]packager/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'assets/[name].[contenthash].[ext]'
            }
          }
        ]
      },
      {
        test: /\.css$/i,
        use: ['style-loader', {
          loader: 'css-loader',
          options: {
            modules: {
              localIdentName: 'sc-[local]',
              exportLocalsConvention: 'camelCase',
            },
          }
        }],
      },
      {
        test: /\.(html|svelte)$/,
        exclude: /scaffolding/,
        use: 'svelte-loader'
      },
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'static'
        }
      ]
    }),
    new webpack.DefinePlugin({
      'process.env.LARGE_ASSET_BASE': JSON.stringify(process.env.LARGE_ASSET_BASE || 'https://packagerdata.turbowarp.org/'),
      // In production mode, generate a unique hash. In development mode, use a random ID every reload as those files are coming from localhost anyways.
      'process.env.SCAFFOLDING_BUILD_ID': process.env.NODE_ENV === 'production' ? JSON.stringify(require('./src/build/generate-scaffolding-build-id')) : 'Math.random()',
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.PLAUSIBLE_API': JSON.stringify(process.env.PLAUSIBLE_API),
      'process.env.PLAUSIBLE_DOMAIN': JSON.stringify(process.env.PLAUSIBLE_DOMAIN),
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/packager/template.ejs',
      chunks: ['packager']
    }),
    new HtmlWebpackPlugin({
      filename: 'example.html',
      template: './src/scaffolding/example.html',
      chunks: []
    }),
    ...(process.env.BUNDLE_ANALYZER ? [new BundleAnalyzerPlugin()] : [])
  ],
  devServer: {
    contentBase: './dist/',
    compress: true,
    overlay: true,
    inline: false,
    host: '0.0.0.0'
  },
};
