const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'var',
    library: 'Scaffolding',
  },
  module: {
    rules: [
      {
        test: /\.mp3$/i,
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
