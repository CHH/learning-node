import cookie from 'cookie'
import crypto from 'crypto'
import path from 'path'
import _mkdirp from 'mkdirp'
import fs from 'fs-promise'

async function mkdirp(path, opts) {
  return new Promise((resolve, reject) => {
    _mkdirp(path, opts, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

export function session(storage) {
  if (typeof storage === 'undefined') {
    storage = new SessionHandler()
  }

  return async (req, res, next) => {
    let cookies = cookie.parse(req.headers.cookie || '')
    let session

    if (typeof cookies['SESSION'] === 'undefined') {
      session = await storage.create()
      session.dirty = true
      await storage.save(session)
    } else if (typeof await storage.find(cookies['SESSION']) === 'undefined') {
      session = new Session(cookies['SESSION'])
      session.dirty = true
      await storage.save(session)
    } else {
      session = await storage.find(cookies['SESSION'])
    }

    req.session = session

    res.setHeader('Set-Cookie', cookie.serialize('SESSION', String(session.id), {
      httpOnly: true,
      maxAge: 60 * 60 * 24,
      domain: 'localhost',
      path: '/'
    }))

    await next()

    return storage.flush(req.session)
  }
}

export class SessionHandler {
  constructor() {
    this.storage = new Map()
  }

  async identifier() {
    return crypto.randomBytes(16).toString('hex')
  }

  async create() {
    let session = new Session(this.identifier())
    return session
  }

  async find(id) {
    return this.storage.get(id)
  }

  async save(session) {
    this.storage.set(session.id, session)
  }

  async flush() {
  }
}

export class SimpleFileHandler extends SessionHandler {
  constructor(path) {
    super()
    this.path = path
  }

  async find(id) {
    if (this.storage.has(id)) {
      return this.storage.get(id)
    }

    let sessionFile = path.resolve(this.path, id)
    let data

    try {
      data = await fs.readFile(sessionFile)
    } catch (error) {
      return
    }

    let json = JSON.parse(data)
    let session = new Session(json.id)

    for (let key of Object.keys(json.values)) {
      session.set(key, json.values[key])
    }

    await this.save(session)

    return session
  }

  async flush(session) {
    try {
      await fs.realpath(this.path)
    } catch (error) {
      await mkdirp(this.path)
    }

    if (typeof session !== 'undefined' && session.dirty) {
      let serialized = {id: session.id, values: session.values}

      return fs.writeFile(path.resolve(this.path, session.id), JSON.stringify(serialized)).then(() => {
        session.dirty = false
      })
    }
  }
}

export class Session {
  constructor(id) {
    this.id = id
    this.values = {}
    this.dirty = false
  }

  set(key, value) {
    this.dirty = true
    this.values[key] = value
    return this
  }

  get(key) {
    return this.values[key]
  }

  has(key) {
    return typeof this.values[key] !== 'undefined'
  }
}
