import AppController from './AppController'

export default class DefaultController extends AppController {
  async indexAction(req, res) {
    let router = await this.app.get('router')

    res.setHeader('location', router.generate('hello', {name: 'Christoph'}))
    res.writeHead(302)
    res.end()
  }
}
