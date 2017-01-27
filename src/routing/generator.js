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
      throw new Error(`Route "${name}" not found`)
    }

    // Error when a route hasn't had a path set, which happens if the route was
    // initialized with named(), but matches() hasn't been called
    if (!route.path) {
      throw new Error(`Route "${name}" has no path`)
    }

    // Compile route patterns if the route wasn't compiled before
    if (!route.compiled) {
      route.compile()
    }

    // Check for parameters missing in the parameters object, with no default value
    // set in the route and throw an error for them (to warn about missing parameters).
    // Fill in the default value if the parameter has one set in the route and the
    // parameter was left out.
    let routeParameterNames = Object.keys(route.vars)

    for (let i = 0; i < routeParameterNames.length; i++) {
      let key = routeParameterNames[i]
      let pos = route.vars[key]

      // There is no default set for the parameter, that means it's mandatory. Throw
      // an error for leaving it out.
      if (typeof route.defaults[key] === 'undefined' && typeof parameters[key] === 'undefined') {
        throw new Error(`Parameter "${key}" missing for generating URL for route ${name}`)
      }

      // Set the default value if the parameter wasn't passed to the generate() method
      // and the paramater isn't mandatory
      if (typeof parameters[key] === 'undefined') {
        parameters[key] = route.defaults[key]
      }
    }

    // The path of the route, including all parameters, e.g. "/hello/world/{name}"
    let path = route.path

    // Replace each instance of the {parameter} in the URL with the provided parameter
    // value
    for (let key of Object.keys(parameters)) {
      path = path.replace(new RegExp(`\{${key}\}`), parameters[key])
    }

    // Returns the path, with all parameter placeholders replaced with the actual
    // value
    return path
  }
}
