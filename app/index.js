import path from 'path'
import {createApp} from '../src'

const app = createApp(Object.assign(
    require('./config/config.js').default(process.env.NODE_ENV || 'prod'),
    {root: path.resolve(__dirname, './')}
))

const requestLogger = async (req, res, next) => {
  // Run all other middleware functions first before we log
  await next()
  console.log(`${req.method} ${req.url} => ${res.statusCode}`)
}

app.use(requestLogger, 'prepend')

export default app
