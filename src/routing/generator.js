import querystring from 'querystring'

class Errors {
  static routeNotFound(route) {
    return new Error(`No such route "${route.name}"`)
  }
  static routeHasNoPath(route) {
    return new Error(`Route "${route.name}" has no path`)
  }
  static routeParameterMissing(route, parameter) {
    return new Error(`Route "${route.name} requires the parameter "${parameter}", that wasn't passed`)
  }
}

// Generates URLs for routes
export default class UrlGenerator {
  // Takes a RouteCollection object consisting of all routes, for looking up a
  // route by its name
  constructor(routes) {
    this.routes = routes
  }

  generate(route, parameters = {}) {
    let name = ''
    // If a route name was given, then look up the route by name in the RouteCollection.
    // Otherwise route is treated as a route object.
    if (typeof route === 'string') {
      name = route
      route = this.routes.atName(name)
    }

    // Route was not found
    if (typeof route === 'undefined') {
      throw Errors.routeNotFound(route)
    }

    // Error when a route hasn't had a path set, which happens if the route was
    // initialized with named(), but matches() hasn't been called
    if (!route.path) {
      throw Errors.routeHasNoPath(route)
    }

    // Compile route patterns if the route wasn't compiled before
    if (!route.compiled) {
      route.compile()
    }

    // Check for parameters missing in the parameters object, with no default value
    // set in the route and throw an error for them (to warn about missing parameters).
    // Fill in the default value if the parameter has one set in the route and the
    // parameter was left out.
    let routeParameterNames = Object.keys(route.parameters)

    for (let i = 0; i < routeParameterNames.length; i++) {
      let key = routeParameterNames[i]
      let pos = route.parameters[key]

      // There is no default set for the parameter, that means it's mandatory. Throw
      // an error when the parameter was not passed to this method.
      if (typeof parameters[key] === 'undefined' && typeof route.defaults[key] === 'undefined') {
        throw Errors.routeParameterMissing(route, key)
      }

      // Set the default value if the parameter wasn't passed to the generate() method
      // and the paramater isn't mandatory
      if (typeof parameters[key] === 'undefined') {
        parameters[key] = route.defaults[key]
      }
    }

    // The path of the route, including all parameters, e.g. "/hello/world/{name}"
    let path = route.path
    let querystringParameters = {}

    // Replace each instance of the {parameter} in the URL with the provided parameter value
    for (let key of Object.keys(parameters)) {
      if (typeof route.parameters[key] === 'undefined') {
        // If a parameter is passed that isn't part of the route's path, then add the parameter
        // to the query string
        querystringParameters[key] = parameters[key]
      } else {
        path = path.replace(new RegExp(`\{${key}\}`), parameters[key])
      }
    }

    if (Object.keys(querystringParameters).length > 0) {
      path += '?' + querystring.stringify(querystringParameters)
    }

    return path
  }
}
