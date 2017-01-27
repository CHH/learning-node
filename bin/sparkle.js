const path = require('path')

console.log('Initializing babel-register')
require('babel-register')({
  plugins: ["transform-es2015-modules-commonjs"]
})

const app = require(path.resolve(process.cwd(), 'app')).default
app.start()
