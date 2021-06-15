const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
      'text-encoding': 'fastestsmallesttextencoderdecoder'
    },
    extensions: ['.mjs', '.js', '.svelte'],
    mainFields: ['svelte', 'browser', 'module', 'main']
  },
  module: {
    rules: [
      {
        test: /\.(mp3|svg|png)$/i,
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
        use: 'svelte-loader'
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/packager/template.ejs',
      chunks: ['packager']
    })
  ],
  devServer: {
    contentBase: './dist/',
  },
};
