import path from 'path'

let app = require(path.resolve(process.cwd(), 'app')).default
app.start()
