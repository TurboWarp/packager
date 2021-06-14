const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  entry: {
    index: './src/export.js',
    addons: './src/addons/index.js'
  },
  module: {
    rules: [
      {
        test: /\.(mp3|svg|png)$/i,
        use: [
          {
            loader: 'url-loader'
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
      }
    ]
  }
};
