import AppController from './AppController'
import querystring from 'querystring'

export default class HelloController extends AppController {
  async indexAction(context) {
    const {req} = context

    if (req.method === 'POST') {
      let name = await context.form.get('name')
      context.get('session').set('name', name)

      return context.redirectToRoute('hello')
    } else {
      let name = context.get('session').get('name')

      return context.render('hello/index.html', {name})
    }
  }
}
