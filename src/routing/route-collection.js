import Route from './route'

// Collects routes and indexes them by name. Is shared between the RequestMatcher and the
// UrlGenerator. Provides nice methods to make it easy to create route objects, by starting with
// the name of pattern.
//
// Example:
//
// const routes = new RouteCollection()
// routes.named('foo').matches('/foo')
//   .to(async (req, res) => res.end('hello world'))
// routes.match('/hello/{name}')
//   .to(async (req, res, {name}) => res.end(`Hello ${name}`))
//   .named('hello')
//
export default class RouteCollection {
  constructor(prefix = '') {
    this.prefix = prefix
    this._routes = new Set()
    this._named = new Map()
    this._collections = new Set()
  }

  // Add a route object. If the name is set, then it's indexed by name.
  add(route) {
    this._routes.add(route)

    if (route.name) {
      this._named.set(route.name, route)
    }

    return this
  }

  addCollection(collection) {
    this._collections.add(collection)
    return this
  }

  has(route) {
    return this._routes.has(route)
  }

  mounted(path, fn) {
    let collection = new RouteCollection(path)
    fn.call(collection, collection)
    return this.addCollection(collection)
  }

  named(name) {
    let route = new Route()
    route.named(name)
    this.add(route)

    return route
  }

  maps(path, options = {}) {
    let route = new Route(path, options)
    this.add(route)

    return route
  }

  entries() {
    if (typeof this._entries !== 'undefined') {
      return this._entries
    }

    this._entries = []

    for (let route of this._routes) {
      this._entries.push(route)
    }

    for (let collection of this._collections) {
      for (let route of collection.entries()) {
        route.path = collection.prefix + route.path
        this._entries.push(route)
      }
    }

    return this._entries
  }

  atName(name) {
    return this._named.get(name)
  }
}
