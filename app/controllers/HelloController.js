import AppController from './AppController'

export default class HelloController extends AppController {
  async indexAction(context) {
    const {req} = context
    const session = context.get('session')

    if (req.method === 'POST') {
      let name = await context.form.get('name')
      session.set('name', name)

      return context.redirectToRoute('hello')
    } else {
      let name = session.get('name')

      return context.render('hello/index.html', {name})
    }
  }
}
