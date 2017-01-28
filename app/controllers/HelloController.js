import AppController from './AppController'

export default class HelloController extends AppController {
  async indexAction(req, res, {name, query: {foo}}) {
    if (name) {
      req.session.values.set('name', name)
    } else {
      name = req.session.values.get('name')
    }

    return this.render(res, 'hello/index.html', {name})
  }
}
