import AppController from './AppController'
import querystring from 'querystring'

export default class HelloController extends AppController {
  async indexAction(req, res) {
    let name = ''

    if (req.method === 'POST') {
      let data = await this.readFormData(req)
      req.session.values.set('name', data.name)

      return this.redirectToRoute(res, 'hello')
    }

    name = req.session.values.get('name')

    return this.render(res, 'hello/index.html', {name})
  }

  async readFormData(req) {
    return new Promise((resolve, reject) => {
      let body = ''

      req.setEncoding('utf8')

      req.on('data', (chunk) => {
        body += chunk
      })
      req.on('end', () => {
        resolve(querystring.parse(body))
      })
    })
  }
}
