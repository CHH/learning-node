import cookie from 'cookie'
import crypto from 'crypto'

class Session {
  constructor(id) {
    this.id = id
    this.values = new Map()
  }

  destroy(res) {
    res.setHeader('Set-Cookie', cookie.serialize('SESSION', '', {
      httpOnly: true,
      maxAge: 0
    }))
  }
}

export default function session() {
  const storage = new Map()

  return async (req, res, next) => {
    let cookies = cookie.parse(req.headers.cookie || '')
    let id = cookies['SESSION']

    if (typeof id === 'undefined' || !storage.get(id)) {
      id = crypto.randomBytes(16).toString('hex')

      const session = new Session(id)
      storage.set(id, session)

      res.setHeader('Set-Cookie', cookie.serialize('SESSION', String(id), {
        httpOnly: true,
        maxAge: 60 * 60 * 24,
      }))

      req.session = session
    } else {
      req.session = storage.get(id)
    }

    return next()
  }
}
