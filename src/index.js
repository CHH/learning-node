console.log('Initializing babel-register')
require('babel-register')({
  plugins: ["transform-es2015-modules-commonjs"]
})
require('./server.js')
