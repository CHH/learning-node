export default (app, route) => {
  route.named('hello_world')
    .matches('/hello/world')
    .withDefaults({name: 'World', _controller: 'hello:index'})

  route.named('hello')
    .matches('/hello/{name}')
    .withDefaults({_controller: 'hello:index', name: 'Jim'})

  route.named('foo')
    .matches('/foo/{bar}')
    .withDefaults({_controller: (req, res, {bar}) => {
      res.end(`Foo: ${bar}`)
    }})

  route.mounted('/bar', route => {
    route.named('bar_index')
      .matches('/')
      .withDefaults({_controller: (req, res) => {
        res.end("Bar Index")
      }})

    route.named('bar_create')
      .matches('/create')
      .withDefaults({_controller: (req, res) => {
        res.end("Bar Create")
      }})
  })

  route.named('default')
    .matches('/')
    .withDefaults({_controller: 'default:index'})
}
