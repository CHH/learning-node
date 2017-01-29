import cookie from 'cookie'
import crypto from 'crypto'
import {SessionHandler} from '../session'

export default function session(storage) {
  if (typeof storage === 'undefined') {
    storage = new SessionHandler()
  }

  return async (req, res, next) => {
    let cookies = cookie.parse(req.headers.cookie || '')
    let session

    if (typeof cookies['SESSION'] === 'undefined' || typeof storage.get(cookies['SESSION']) === 'undefined') {
      session = storage.create()
      storage.save(session.id, session)
      req.session = session
    } else {
      req.session = storage.get(cookies['SESSION'])
    }

    res.setHeader('Set-Cookie', cookie.serialize('SESSION', String(session.id), {
      httpOnly: true,
      maxAge: 60 * 60 * 24,
      domain: 'localhost',
      path: '/'
    }))

    await next()

    storage.flush()
  }
}
