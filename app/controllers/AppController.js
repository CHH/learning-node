export default class AppController {
  constructor(app) {
    this.app = app
  }

  async render(res, template, context = {}, statusCode = 200) {
    let view = await this.app.get('view')

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
}
