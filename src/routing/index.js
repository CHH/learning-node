import {matchMethod, matchPath} from './match'

const identifierStartExpr = /[a-zA-Z]/
const identifierExpr = /[a-zA-Z_]/

export class Route {
  constructor(path = '', {name, defaults, method} = {name: '', defaults: {}, method: ''}) {
    this.name = name
    this.defaults = defaults
    this.path = '' + path
    this.compiled = false
    this.vars = new Map()
    this.method = method
  }

  withDefaults(defaults = {}) {
    this.defaults = defaults
    return this
  }

  matchesMethod(method) {
    this.method = method
    return this
  }

  matches(path) {
    this.path = path
    return this
  }

  named(name) {
    this.name = name
    return this
  }

  compile() {
    // path = '/hello/world/{name}'
    let pattern = ''
    let i = 0
    let currentParameter = ''
    let inParameter = false
    let parameterCount = 0

    while (i < this.path.length) {
      if (this.path.charAt(i) === '{' && identifierStartExpr.test(this.path.charAt(i+1))) {
        inParameter = true
      } else if (inParameter && this.path.charAt(i) === '}') {
        pattern += '([^/]+)'
        this.vars.set(currentParameter, ++parameterCount)
        inParameter = false
        currentParameter = ''
      } else if (inParameter && identifierExpr.test(this.path.charAt(i))) {
        currentParameter += this.path.charAt(i)
      } else {
        pattern += this.path.charAt(i)
      }
      ++i
    }

    this.pattern = new RegExp('^' + pattern + '$')
    this.compiled = true
  }
}

class RouteCollection {
  constructor() {
    this._routes = new Set()
    this._named = new Map()
  }

  add(route) {
    this._routes.add(route)

    if (route.name) {
      this._named.set(route.name, route)
    }

    return this
  }

  has(route) {
    return this._routes.has(route)
  }

  named(name) {
    let route = new Route()
    route.named(name)
    this.add(route)

    return route
  }

  match(path, options = {}) {
    let route = new Route(path, options)
    this.add(route)

    return route
  }

  entries() {
    return this._routes.entries()
  }

  atName(name) {
    return this._named.get(name)
  }
}

class RouteMatch {
  constructor(req, route, vars, matched = false) {
    this.req = req
    this.route = route
    this.vars = vars
    this.matched = false
  }
}

export class Router {
  constructor() {
    this.routes = new RouteCollection()

    this.matchers = new Set()
    this.matchers.add(matchMethod)
    this.matchers.add(matchPath)
  }

  middleware() {
    return async (req, res, next) => {
      let match = await this.match(req)
      req.context.router = {match}

      return next()
    }
  }

  async match(req) {
    let entries = this.routes.entries()

    for (let route of entries) {
      // TODO: fix route.path is undefined here
      console.log(route.path)

      if (!route.path) {
        continue
      }

      if (!route.compiled) {
        route.compile()
      }

      let matchers = this.matchers.entries()
      matchers.reverse()
      console.log(matchers)

      let match = new RouteMatch(req, route, Object.assign({}, route.defaults))

      let next = async () => {
        let matcher = matchers.pop()

        if (typeof matcher === 'undefined') {
          return
        }

        return matcher(match, next)
      }

      await next()

      return match
    }
  }

  generate(name, parameters = {}) {
    return this.generator.generate(name, parameters)
  }
}
