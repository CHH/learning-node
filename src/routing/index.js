export class Route {
  constructor(path, {name, defaults, method} = {name: '', defaults: {}, method: ''}) {
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

  withMethod(method) {
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
    let pattern = '^'
    let i = 0
    let currentVar = ''
    let isVar = false
    let vars = 0

    while (i < this.path.length) {
      if (this.path.charAt(i) === '{' && /[a-zA-Z]/.test(this.path.charAt(i+1))) {
        isVar = true
      } else if (isVar && this.path.charAt(i) === '}') {
        pattern += '([^/]+)'
        this.vars.set(currentVar, ++vars)

        isVar = false
        currentVar = ''
      } else if (isVar && /[a-zA-Z_]/.test(this.path.charAt(i))) {
        currentVar += this.path.charAt(i)
      } else {
        pattern += this.path.charAt(i)
      }
      ++i
    }

    this.pattern = pattern + '$'
    this.compiled = true
  }
}

class RouteMatch {
  constructor(route, vars) {
    this.route = route
    this.vars = vars
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

  named(name) {
    let route = new Route('')
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
    return this._routes
  }

  atName(name) {
    return this._named.get(name)
  }
}

export class Router {
  get routes() {
    if (typeof this._routes === 'undefined') {
      this._routes = new RouteCollection()
    }
    return this._routes
  }

  middleware() {
    return async (req, res, next) => {
      let match = this.match(req)
      req.context.router = {match}

      return next()
    }
  }

  match(req) {
    for (let route of this.routes.entries()) {
      if (!route.compiled) {
        route.compile()
      }

      if (!route.path || (route.method && route.method !== req.method)) {
        continue
      }

      let vars = Object.assign({}, route.defaults)
      let regExp = new RegExp(route.pattern)
      let matches = regExp.exec(req.url)

      if (matches) {
        for (let [key, pos] of route.vars) {
          if (typeof matches[pos] !== undefined && matches[pos] !== '') {
            vars[key] = matches[pos]
          } else {
            vars[key] = route.defaults[key]
          }
        }

        return new RouteMatch(route, vars)
      }
    }
  }

  generate(name, parameters = {}) {
    let route = this.routes.atName(name)

    if (typeof route === 'undefined') {
      throw new Error(`Route "${name}" not found`)
    }

    if (!route.path) {
      throw new Error(`Route "${name}" has no path`)
    }

    if (!route.compiled) {
      route.compile()
    }

    for (let [key, pos] of route.vars) {
      if (typeof route.defaults[key] === 'undefined' && typeof parameters[key] === 'undefined') {
        throw new Error(`Parameter "${key}" missing for generating URL for route ${name}`)
      }

      if (typeof parameters[key] === 'undefined') {
        parameters[key] = route.defaults[key]
      }
    }

    let path = route.path

    for (let key of Object.keys(parameters)) {
      path = path.replace(new RegExp(`\{${key}\}`), parameters[key])
    }

    return path
  }
}
