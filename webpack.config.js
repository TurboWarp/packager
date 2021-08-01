const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');
const AddBuildIDToOutputPlugin = require('./src/build/add-build-id-to-output-plugin');
const GenerateServiceWorkerPlugin = require('./src/build/generate-service-worker-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const base = {
  mode: isProduction ? 'production' : 'development'
};
const dist = path.resolve(__dirname, 'dist');
const buildId = isProduction ? require('./src/build/generate-scaffolding-build-id') : null;

const makeScaffolding = ({full}) => ({
  ...base,
  devtool: isProduction ? '' : 'source-map',
  output: {
    filename: 'scaffolding/[name].js',
    path: dist
  },
  entry: full ? {
    scaffolding: './src/scaffolding/export.js',
    addons: './src/addons/index.js'
  } : {
    'scaffolding-min': './src/scaffolding/export.js'
  },
  resolve: {
    alias: {
      'text-encoding$': 'fastestsmallesttextencoderdecoder',
      'htmlparser2$': path.resolve(__dirname, 'src', 'scaffolding', 'htmlparser2'),
      'scratch-translate-extension-languages$': path.resolve(__dirname, 'src', 'scaffolding', 'scratch-translate-extension-languages', 'languages.json')
    }
  },
  module: {
    rules: [
      {
        test: /\.(svg|png)$/i,
        use: [{
          loader: 'url-loader'
        }]
      },
      ...(full ? [{
        test: /\.mp3$/i,
        use: [{
          loader: 'url-loader',
          options: {
            esModule: false
          }
        }]
      }] : [{
        test: /\.mp3$/i,
        use: [{
          loader: path.resolve(__dirname, 'src', 'build', 'noop-loader.js')
        }]
      }]),
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
  },
  resolveLoader: {
    // Replace worker-loader with our own modified version
    modules: [path.resolve(__dirname, 'src', 'build', 'inline-worker-loader'), 'node_modules'],
  },
  plugins: [
    ...(buildId ? [new AddBuildIDToOutputPlugin(buildId)] : []),
    ...(process.env.BUNDLE_ANALYZER === (full ? '1' : '2') ? [new BundleAnalyzerPlugin()] : [])
  ]
});

const makeWebsite = () => ({
  ...base,
  devtool: 'source-map',
  output: {
    filename: isProduction ? 'js/[name].[contenthash].js' : 'js/[name].js',
    path: dist
  },
  entry: {
    packager: './src/packager/index.js'
  },
  resolve: {
    alias: {
      svelte: path.resolve('node_modules', 'svelte')
    },
    extensions: ['.mjs', '.js', '.svelte'],
    mainFields: ['svelte', 'browser', 'module', 'main']
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  module: {
    rules: [
      {
        test: /\.png$/i,
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
        test: /\.(html|svelte)$/,
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
      'process.env.SCAFFOLDING_BUILD_ID': buildId ? JSON.stringify(buildId) : 'Math.random().toString()',
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.PLAUSIBLE_API': JSON.stringify(process.env.PLAUSIBLE_API),
      'process.env.PLAUSIBLE_DOMAIN': JSON.stringify(process.env.PLAUSIBLE_DOMAIN),
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/packager/template.ejs',
      chunks: ['packager']
    }),
    new GenerateServiceWorkerPlugin(),
    ...(process.env.BUNDLE_ANALYZER === '3' ? [new BundleAnalyzerPlugin()] : [])
  ],
  devServer: {
    contentBase: './dist/',
    compress: true,
    overlay: true,
    inline: false,
    host: '0.0.0.0'
  },
});

module.exports = [
  makeScaffolding({full: true}),
  makeScaffolding({full: false}),
  makeWebsite()
];
