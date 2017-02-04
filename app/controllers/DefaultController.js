import AppController from './AppController'

export default class DefaultController extends AppController {
  async indexAction(context) {
    return context.redirectToRoute('hello', {name: 'Christoph', foo: 'bar'})
  }
}
