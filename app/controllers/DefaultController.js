import AppController from './AppController'

export default class DefaultController extends AppController {
    async indexAction(req, res) {
        return this.render(res, 'default/index.html', {name: 'Christoph'})
    }
}
