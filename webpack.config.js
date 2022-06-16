const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');
const AddBuildIDToOutputPlugin = require('./src/build/add-build-id-to-output-plugin');
const GenerateServiceWorkerPlugin = require('./src/build/generate-service-worker-plugin');
const EagerDynamicImportPlugin = require('./src/build/eager-dynamic-import-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const isStandalone = !!process.env.STANDALONE;
const base = {
  mode: isProduction ? 'production' : 'development'
};
const dist = path.resolve(__dirname, 'dist');
const buildId = isProduction ? require('./src/build/generate-scaffolding-build-id') : null;

const getVersion = () => {
  if (process.env.VERSION) {
    return process.env.VERSION;
  }
  if (isStandalone) {
    const now = new Date();
    const dateString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const packageJSON = require('./package.json');
    const version = packageJSON.version;
    return `Standalone v${version} (${dateString})`;
  }
  return null;
};
const version = getVersion();

const makeScaffolding = ({full}) => ({
  ...base,
  devtool: isProduction ? '' : 'source-map',
  output: {
    filename: 'scaffolding/[name].js',
    path: dist
  },
  entry: full ? {
    'scaffolding-full': './src/scaffolding/export.js',
    addons: './src/addons/index.js'
  } : {
    'scaffolding-min': './src/scaffolding/export.js'
  },
  resolve: {
    alias: {
      'text-encoding$': path.resolve(__dirname, 'src', 'scaffolding', 'text-encoding'),
      'htmlparser2$': path.resolve(__dirname, 'src', 'scaffolding', 'htmlparser2'),
      'scratch-translate-extension-languages$': path.resolve(__dirname, 'src', 'scaffolding', 'scratch-translate-extension-languages', 'languages.json'),
      'scratch-parser$': path.resolve(__dirname, 'src', 'scaffolding', 'scratch-parser')
    }
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, 'src'),
          /node_modules[\\/]scratch-[^\\/]+[\\/]src/
        ],
        options: {
          babelrc: false,
          presets: ['@babel/preset-env']
        }
      },
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
        use: [
          {
            loader: 'style-loader',
            options: {
              // This function is stringified and run in a web environment
              insert: (styleElement) => {
                var el = document.head || document.body || document.documentElement;
                el.insertBefore(styleElement, el.firstChild);
              }
            }
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: 'sc-[local]',
                exportLocalsConvention: 'camelCase',
              },
            }
          }
        ],
      }
    ]
  },
  resolveLoader: {
    // Replace worker-loader with our own modified version
    modules: [path.resolve(__dirname, 'src', 'build', 'inline-worker-loader'), 'node_modules'],
  },
  plugins: [
    ...(buildId ? [new AddBuildIDToOutputPlugin(buildId)] : []),
    ...(process.env.BUNDLE_ANALYZER === (full ? 'scaffolding-full' : 'scaffolding-min') ? [new BundleAnalyzerPlugin()] : [])
  ]
});

const commonFrontendPlugins = () => [
  new webpack.DefinePlugin({
    'process.env.SCAFFOLDING_BUILD_ID': buildId ? JSON.stringify(buildId) : 'Math.random().toString()',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  })
];

const makeWebsite = () => ({
  ...base,
  devtool: isStandalone ? '' : 'source-map',
  output: {
    filename: isProduction ? 'js/[name].[contenthash].js' : 'js/[name].js',
    path: dist
  },
  entry: {
    p4: './src/p4/index.js'
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
      chunks: 'all',
      minChunks: 2
    }
  },
  module: {
    rules: [
      {
        test: /\.png|\.svg$/i,
        use: isStandalone ? {
          loader: 'url-loader'
        } : {
          loader: 'file-loader',
          options: {
            name: 'assets/[name].[contenthash].[ext]'
          }
        }
      },
      {
        test: /\.(html|svelte)$/,
        use: 'svelte-loader'
      },
    ]
  },
  plugins: [
    ...commonFrontendPlugins(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'static'
        }
      ]
    }),
    new webpack.DefinePlugin({
      'process.env.ENABLE_SERVICE_WORKER': JSON.stringify(process.env.ENABLE_SERVICE_WORKER),
      'process.env.STANDALONE': JSON.stringify(isStandalone ? true : false),
      'process.env.VERSION': JSON.stringify(version),
      'process.env.PLAUSIBLE_API': JSON.stringify(process.env.PLAUSIBLE_API),
      'process.env.PLAUSIBLE_DOMAIN': JSON.stringify(process.env.PLAUSIBLE_DOMAIN),
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/p4/template.ejs',
      chunks: ['p4']
    }),
    new GenerateServiceWorkerPlugin(),
    ...(isStandalone ? [new EagerDynamicImportPlugin()] : []),
    ...(process.env.BUNDLE_ANALYZER === 'p4' ? [new BundleAnalyzerPlugin()] : [])
  ],
  devServer: {
    contentBase: './dist/',
    compress: true,
    overlay: true,
    inline: false,
    host: '0.0.0.0',
    port: 8947
  },
});

const makeNode = () => ({
  ...base,
  devtool: '',
  target: 'node',
  output: {
    filename: '[name].js',
    path: dist,
    library: 'packager',
    libraryTarget: 'umd'
  },
  node: {
    __dirname: false,
  },
  entry: {
    packager: './src/packager/node/export.js'
  },
  externals: {
    jszip: 'jszip',
    'cross-fetch': 'cross-fetch',
    'sha.js': 'sha.js',
    '@fiahfy/icns': '@fiahfy/icns'
  },
  module: {
    rules: [
      {
        test: /\.png|\.svg$/i,
        use: 'file-loader'
      }
    ]
  },
  plugins: [
    ...commonFrontendPlugins(),
    ...(process.env.BUNDLE_ANALYZER === 'node' ? [new BundleAnalyzerPlugin()] : [])
  ],
});

module.exports = [
  makeScaffolding({full: true}),
  makeScaffolding({full: false}),
  ...(process.env.BUILD_MODE === 'node' ? [
    makeNode()
  ] : [
    makeWebsite()
  ])
];
