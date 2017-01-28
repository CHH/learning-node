export default class AppController {
  constructor(app) {
    this.app = app
  }

  async generateUrl(route, parameters) {
    const router = await this.app.get('router')
    return router.generate(route, parameters)
  }

  async render(res, template, context = {}, statusCode = 200) {
    const view = await this.app.get('view')

    return new Promise((resolve, reject) => {
      view.render(template, context, (err, buf) => {
        if (err) {
          reject(err)
          return
        }

        res.writeHead(statusCode)
        res.end(buf)
        resolve(res)
      })
    })
  }

  async redirect(res, path, statusCode = 302) {
    res.setHeader('location', path)
    res.writeHead(statusCode)
    res.end()
  }

  async redirectToRoute(res, route, parameters, statusCode = 302) {
    return this.redirect(res, await this.generateUrl(route, parameters), statusCode)
  }
}
