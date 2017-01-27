import {RequestMatcher} from './match'
import UrlGenerator from './generator'

const identifierStartExpr = /[a-zA-Z]/
const identifierExpr = /[a-zA-Z0-9_]/

// Route class, which represents a route with a path, name, and defaults
export class Route {
  constructor(path = '', {name, defaults, method} = {name: '', defaults: {}, method: ''}) {
    // This name can be used to fetch the route from the RouteCollection (e.g. when
    // generating a URL)
    this.name = name
    // Default parameters for parameters in the route path, makes the parameter
    // in the path optional
    this.defaults = defaults
    // Path as String with placeholders, e.g. /hello/world/{name}
    this.path = '' + path
    // Match the request's method on this URL in addition to the path
    this.method = method
    // Was Route.compile() called?
    this.compiled = false
    // All found parameters in the path, with their offset, e.g. `{name: 1}`. The
    // index is the number of the subpattern within the RegExp. That means the parameter's
    // value can be retrieved by fetching the index from the matches returned by
    // RegExp.exec().
    this.vars = {}
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

  // Compiles the route's path. Finds all parameters in the path, registers them
  // in the vars object and compiles a RegExp
  compile() {
    // path = '/hello/world/{name}'
    let pattern = ''
    // Current character in the path
    let i = 0
    // Name of the current parameter, starts getting populated when a '{' character
    // is found. Gets reset when a '}' character was found.
    let currentParameter = ''
    // Are we currently parsing a parameter name?
    let inParameter = false
    // Number of parameters found
    let parameterCount = 0

    // Loop over all characters in the route, one by one, to find the special characters
    // denoting parameters
    while (i < this.path.length) {
      // We found the start of a parameter expression, e.g. {name}, and it starts
      // with a character.
      if (this.path.charAt(i) === '{' && identifierStartExpr.test(this.path.charAt(i+1))) {
        inParameter = true
      // We are parsing a parameter and found the closing brace, so add the parameter
      // to the vars with the index. Reset the current parameter name.
      } else if (inParameter && this.path.charAt(i) === '}') {
        pattern += '([^/]+)'
        this.vars[currentParameter] = ++parameterCount
        inParameter = false
        currentParameter = ''
      // Parameter names can only consist of a-z, A-Z, _, or numbers, continue
      // capturing the paramater name in the currentParameter variable
      } else if (inParameter && identifierExpr.test(this.path.charAt(i))) {
        currentParameter += this.path.charAt(i)
      // Write everything else verbatim to the pattern
      } else {
        pattern += this.path.charAt(i)
      }
      ++i
    }

    // Create the RegExp object with the compiled regular expression and match
    // from beginning to end
    this.pattern = new RegExp('^' + pattern + '$')

    // Mark the route as compiled, so other parts of the code can avoid expensive
    // compilation when it isn't necessary. We do compile always when compile() is
    // called (not skipping when the flag was set), to allow consumers to recompile
    // routes when necessary, e.g. when changing the path after it was already compiled.
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
    return this._routes
  }

  atName(name) {
    return this._named.get(name)
  }
}

export class Router {
  constructor() {
    this.routes = new RouteCollection()
    this.generator = new UrlGenerator(this.routes)
    this.matcher = new RequestMatcher(this.routes)
  }

  middleware() {
    return async (req, res, next) => {
      let match = await this.match(req)
      req.context.router = {match}

      return next()
    }
  }

  // Matches the request to a route using the RequestMatcher
  async match(req) {
    return this.matcher.match(req)
  }

  // Generate a path for a route, given the paramaters, using the UrlGenerator
  generate(name, parameters = {}) {
    return this.generator.generate(name, parameters)
  }
}
