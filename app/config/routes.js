export default (app, route) => {
  route.named('hello_world')
    .matches('/hello/world')
    .to('hello:index')
    .withDefaults({name: 'World'})

  route.named('hello')
    .matches('/hello/{name}')
    .to('hello:index')
    .withDefaults({name: 'Jim'})

  route.named('foo').matches('/foo/{bar}').to(async (req, res, {bar}) => {
    res.end(`Foo: ${bar}`)
  })

  route.mounted('/bar', route => {
    route.named('bar_index').matches('/').to(async (req, res) => {
      res.end("Bar Index")
    })

    route.named('bar_create').matches('/create').to(async (req, res) => {
      res.end("Bar Create")
    })
  })

  route.named('default').matches('/').to('default:index')
}
