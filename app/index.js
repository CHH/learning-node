import path from 'path'
import {createApp} from '../src/app'

const app = createApp(Object.assign(
    require('./config/config.js').default(process.env.NODE_ENV || 'prod'),
    {root: path.resolve(__dirname, './')}
))

export default app
