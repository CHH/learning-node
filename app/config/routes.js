export default (app, route) => {
  route.named('hello')
    .maps('/hello')
    .to('hello:index')

  route.named('foo').maps('/foo/{bar}').to(async ({req, res}, {bar}) => {
    res.end(`Foo: ${bar}`)
  })

  route.mounted('/bar', route => {
    route.named('bar_index').maps('/').to(async ({req, res}) => {
      res.end("Bar Index")
    })

    route.named('bar_create').maps('/create').to(async ({req, res}) => {
      res.end("Bar Create")
    })
  })

  route.named('missing').maps('/missing').to('default:missingRoute')

  route.named('default').maps('/').to('default:index')
}
