import AppController from './AppController'

export default class HelloController extends AppController {
  async indexAction(req, res, {name, query: {foo}}) {
    console.log(foo)
    return this.render(res, 'hello/index.html', {name})
  }
}
