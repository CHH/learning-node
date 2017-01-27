export default (app, route) => {
  route.named('hello_world')
    .matches('/hello/world')
    .withDefaults({name: 'World', _controller: 'hello:index'})

  route.named('hello')
    .matches('/hello/{name}')
    .withDefaults({_controller: 'hello:index'})

  route.named('foo')
    .matches('/foo/{bar}')
    .matchesMethod('POST')
    .withDefaults({_controller: (req, res, {bar}) => {
      res.end(`Foo: ${bar}`)
    }})

  route.named('default')
    .matches('/')
    .withDefaults({_controller: 'default:index'})
}
