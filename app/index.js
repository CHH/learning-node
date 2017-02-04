import path from 'path'
import {createApp} from '../src'
import {session, SimpleFileHandler} from '../src/session'

const root = path.resolve(__dirname, './')

const app = createApp(Object.assign(
    require('./config/config.js').default(process.env.NODE_ENV || 'prod'),
    {root}
))

const requestLogger = async (context, next) => {
  // Run all other middleware functions first before we log
  await next()

  let {req, res} = context

  console.log(context.get('session').id, context.get('session').values)
  console.log(`${req.method} ${req.url} => ${res.statusCode}`)
}

app.use(requestLogger, 'prepend')
app.use(session(new SimpleFileHandler(path.resolve(__dirname, 'var/sessions'))), 'prepend')

export default app
