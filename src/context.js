import FormData from './form'
import CookieData from './cookie'

export default class Context {
  constructor({req, res, container}) {
    this.req = req
    this.res = res
    this.container = container
    this.values = new Map()
    this.form = new FormData(req)
    this.cookie = new CookieData(req)
  }

  set(key, value) {
    this.values.set(key, value)
    return this
  }

  get(key) {
    return this.values.get(key)
  }

  has(key) {
    return this.values.has(key)
  }

  async generateUrl(route, parameters) {
    const router = await this.container.get('router')

    return router.generate(route, parameters)
  }

  async redirect(path, statusCode = 302) {
    this.res.setHeader('location', path)
    this.res.writeHead(statusCode)
    this.res.end()
  }

  async redirectToRoute(route, parameters, statusCode = 302) {
    return this.redirect(await this.generateUrl(route, parameters), statusCode)
  }

  async render(template, context, statusCode = 200) {
    const view = await this.container.get('view')

    return new Promise((resolve, reject) => {
      view.render(template, context, (err, buf) => {
        if (err) {
          reject(err)
          return
        }

        this.res.setHeader('Content-Type', 'text/html')
        this.res.writeHead(statusCode)
        this.res.end(buf, 'utf8')

        resolve()
      })
    })
  }
}
