let mix = require('laravel-mix')
let path = require('path')

mix.extend('nova', new require('laravel-nova-devtool'))

mix
  .setPublicPath('dist')
  .js('resources/js/tool.js', 'js')
  .vue({ version: 3 })
  .nova('shuvroroy/nova-dynamic-views')
  .alias({ '@': path.join(__dirname, 'resources/js/') })
