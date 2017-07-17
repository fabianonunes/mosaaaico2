const webpack = require('webpack')
const glob = require('glob')
const path = require('path')
const _ = require('lodash')
const utils = require('./utils')
const autoprefixer = require('autoprefixer')
const FilterStyleStubs = require('./plugins/filterStyleStubs.js')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const ENV = process.env.NODE_ENV || 'development'
const port = Number(process.env.PORT) || 8000
const isProduction = ENV === 'production'

const stylesLoaders = [
  'css-loader?sourceMap',
  {
    loader: 'postcss-loader',
    options: {
      sourceMap: true,
      plugins: () => [
        autoprefixer({ browsers: 'last 2 versions' }),
        require('postcss-custom-media')()
      ]
    }
  }
]

const lessLoaders = stylesLoaders.concat([
  'less-loader?sourceMap'
])

// const sassLoaders = stylesLoaders.concat([
//   'resolve-url-loader',
//   'sass-loader?sourceMap'
// ])

const extractCSS = new ExtractTextPlugin({ filename: '[name].css', allChunks: true })
const extractLESS = new ExtractTextPlugin({ filename: '[name].css', allChunks: true })
const extractSASS = new ExtractTextPlugin({ filename: '[name].css', allChunks: true })

// setar todos os arquivos de estilos em src/styles
const styles = _.fromPairs(glob.sync('./src/styles/*.{less,scss,css}').map(_ => {
  return ['styles/' + path.basename(_.replace(/(le|sc)ss$/, 'css'), '.css'), _]
}))

// setar todos os arquivos de scripts em src/js
const scripts = _.fromPairs(glob.sync('./src/js/*.js').map(_ => {
  return ['js/' + path.basename(_, '.js'), _]
}))

// const pages = _.fromPairs(glob.sync('./src/pages/*.{pug,html}').map(_ => {
//   return [path.basename(_.replace(/pug$/, 'html'), '.html'), _]
// }))

// setar todos os htmls de estilos em src
const htmls = glob.sync('./src/*.{html,pug}').map(template => {
  const filename = path.basename(template).replace(/\.(html|pug)$/, '')
  return new HtmlWebpackPlugin({
    template: template,
    filename: filename + '.html',
    inject: false,
    chunks: []
  })
})

var plugins = [
  new webpack.NoEmitOnErrorsPlugin(),
  extractCSS,
  extractLESS,
  extractSASS
]

if (isProduction) {
  // plugins = plugins.concat(htmls)
  plugins.push(new FilterStyleStubs())
  if (utils.fileExists('./src/assets')) {
    plugins.push(new CopyWebpackPlugin([
      { from: './src/assets', to: 'assets' }
    ]))
  }
}

if (scripts['js/vendors']) {
  plugins.push(
    new webpack.optimize.CommonsChunkPlugin({
      name: 'js/vendors',
      minChunks: Infinity,
      filename: 'js/vendors.js'
    })
  )
}

module.exports = {
  output: {
    filename: '[name].js',
    path: isProduction ? './dist' : void 0,
    // publicPath: isProduction ? '/' : `http://${os.hostname()}:${port}/`
    publicPath: isProduction ? '/' : `http://localhost:${port}/`
  },

  entry: _.assign({}, styles, scripts),

  module: {
    rules: [{
      test: /\.(css)$/,
      loader: extractCSS.extract({
        use: stylesLoaders,
        publicPath: '../'
      })
    }, {
      test: /\.(less)$/,
      loader: extractLESS.extract({
        use: lessLoaders,
        publicPath: '../'
      })
    // }, {
    //   test: /\.(scss)$/,
    //   loader: extractSASS.extract({
    //     use: sassLoaders,
    //     publicPath: '../'
    //   })
    }, {
      test: /\.json$/,
      loader: 'json-loader'
    }, {
      test: /\.(pug|jade)$/,
      loader: 'pug-loader',
      options: {
        pretty: true,
        root: utils.resolveApp('./node_modules')
      }
    }, {
      test: /\.(svg|woff|ttf|eot|woff2)(\?.*)?$/i,
      loader: isProduction
        ? 'file-loader?name=fonts/[name]_[hash:5].[ext]'
        : 'file-loader?name=fonts/[name].[ext]'
    }, {
      test: /\.(png|jpeg|gif)(\?.*)?$/i,
      loader: isProduction
        ? 'file-loader?name=images/[name]_[hash:5].[ext]'
        : 'file-loader?name=images/[name].[ext]'
    }]
  },

  plugins,

  devtool: isProduction ? '' : 'inline-source-map',

  devServer: {
    contentBase: './src',
    publicPath: '/',
    port,
    stats: {
      timings: true,
      chunkModules: false,
      chunks: false
    },
    setup: function (app) {
      require('./dev/pug-server')(app)
    }
  }
}
