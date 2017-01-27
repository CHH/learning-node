import AppController from './AppController'

export default class HelloController extends AppController {
  async indexAction(req, res, {name}) {
    return this.render(res, 'hello/index.html', {name})
  }
}
