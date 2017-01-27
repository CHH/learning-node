export default (route) => {
  route.named('hello_world')
    .matches('/hello/world')
    .withDefaults({name: 'World', _controller: 'hello:index'})

  route.named('hello')
    .matches('/hello/{name}')
    .withDefaults({_controller: 'hello:index'})

  route.named('default')
    .matches('/')
    .withDefaults({_controller: 'default:index'})
}
