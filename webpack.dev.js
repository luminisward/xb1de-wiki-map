const fs = require('fs')
const path = require('path')
const md5 = require('md5')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const config = require('./config')
const webpack = require('webpack')

module.exports = {
  entry: ['@babel/polyfill', './src/main.js'],
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [path.resolve(__dirname, 'src')],
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: ['syntax-dynamic-import']
        }
      },
      {
        test: /\.(scss|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.png$/,
        use: [{
          loader: 'file-loader',
          options: {
            name (file) {
              const filename = path.basename(file)
              const filenameInMw = filename.charAt(0).toUpperCase() + filename.slice(1)
              const filenameMd5 = md5(filenameInMw)
              return `${filenameMd5.slice(0, 1)}/${filenameMd5.slice(0, 2)}/${filenameInMw}`
            },
            // emitFile: false,
            publicPath: '/images',
            outputPath: 'images'
          }
        }]
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader',
        options: {
          removeSVGTagAttrs: false
        }
      }
    ]
  },

  output: {
    chunkFilename: 'xb1map.js',
    filename: '[name].js'
  },

  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html'
    }),
    new MiniCssExtractPlugin({
      chunkFilename: 'xb1map.css'
    }),
    new OptimizeCSSAssetsPlugin({
      cssProcessorOptions: { safe: true }
    }),
    new webpack.DefinePlugin({
      MAPFILES: JSON.stringify(fs.readdirSync(path.resolve(__dirname, 'src', 'map-images')))
    })
  ],

  mode: 'development',

  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          priority: -10,
          test: /[\\/]node_modules[\\/]||[\\/]src[\\/]xb1map.js/,
          chunks: 'all'
        }
      },
      minChunks: 2,
      minSize: 0,
      name: true
    }
  },

  devtool: 'source-map',

  devServer: {
    host: '0.0.0.0',
    port: 8080,
    clientLogLevel: 'warning',
    quiet: true,
    compress: true,
    proxy: config.proxyTable
  }
}
