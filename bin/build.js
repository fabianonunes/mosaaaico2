#!/usr/bin/env node

var spawn = require('cross-spawn')
var rimraf = require('rimraf')
var path = require('path')
var fs = require('fs')
var fse = require('fs-extra')
var glob = require('glob')
var utils = require('../utils')
var json = require('json-update')
var script = process.argv[2]
var isPublic = process.env.PUBLIC !== void 0

var builderDirectory = fs.realpathSync(__dirname)

var config = utils.fileExists(utils.resolveApp('webpack.config.js'))
  ? [] : ['--config', path.resolve(builderDirectory, '../default.js')]

if (isPublic) {
  config = [...config, '--host', (isPublic ? process.env.PUBLIC : 'localhost')]
}

var result
switch (script) {
  case 'build':
    process.env.NODE_ENV = 'production'
    rimraf.sync('./dist')
    result = spawn.sync(
      './node_modules/webpack/bin/webpack.js',
      ['-p', '--progress'].concat(config),
      { stdio: 'inherit' }
    )
    rimraf.sync('./dist/styles/*.js')
    process.exit(result.status)
    break

  case 'dev':
    process.env.NODE_ENV = 'development'
    result = spawn.sync(
      './node_modules/webpack-dev-server/bin/webpack-dev-server.js',
      ['--inline', '--progress', '--colors'].concat(config),
      { stdio: 'inherit' }
    )
    process.exit(result.status)
    break

  case 'init':
    if (process.env.TEMPLATE !== 'true') {
      break
    }

    const configPaths = path.join(__dirname, '..', 'config/.*')
    const pathRe = /node_modules(\/|\\)mosaaaico2$/
    if (pathRe.test(process.cwd())) {
      process.chdir('../..')
    }
    const cwd = path.resolve()
    glob.sync(configPaths).forEach(_ => {
      const dest = path.join(cwd, path.basename(_))
      if (!utils.fileExists(dest)) {
        fse.copySync(_, dest)
      }
    })
    fse.mkdirsSync(path.join(cwd, 'src/styles'))
    fse.mkdirsSync(path.join(cwd, 'src/js'))
    json.update(path.join(cwd, 'package.json'), {
      scripts: {
        dev: 'mosaaaico2 dev',
        build: 'mosaaaico2 build'
      }
    })
    break

  default:
    console.log('Unknown script "' + script + '".')
    process.exit(1)
    break
}
