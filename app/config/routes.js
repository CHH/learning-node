import {Route} from '../../src/routing'

export default (route) => {
    route.named('hello2').match('/hello/world').withDefaults({name: 'World', _controller: 'hello:index'})
    route.named('hello').match('/hello/{name}').withDefaults({_controller: 'hello:index'})

    route.match('/')
        .withDefaults({_controller: 'default:index'})
        .named('default')
}
