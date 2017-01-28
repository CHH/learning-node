import AppController from './AppController'

export default class DefaultController extends AppController {
  async indexAction(req, res) {
    return this.redirectToRoute(res, 'hello', {name: 'Christoph', foo: 'bar'})
  }
}
