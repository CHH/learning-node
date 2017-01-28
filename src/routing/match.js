import querystring from 'querystring'

class Match {
  constructor(req, route, parameters, matched = false) {
    this.req = req
    this.route = route
    this.parameters = parameters
    this.matched = false
  }
}

// Matches requests to routes
export class RequestMatcher {
  constructor(routes) {
    this.routes = routes
    this.matchers = []
    this.addMatcher(defaultMatcher)
  }

  addMatcher(matcher) {
    this.matchers.push(matcher)
    return this
  }

  async match(req) {
    // Loop through all known routes
    let entries = this.routes.entries()

    for (let i = 0; i < entries.length; i++) {
      let route = entries[i]

      // Skip the route and do not do anything further if there isn't any path
      // we can match. A route can only have no path if it wasn't setup correctly.
      if (!route.path) {
        continue
      }

      // If the route isn't compiled, then start the compile process. Since compiling
      // involves parsing route expressions, which can be expensive, we do it only
      // once per route.
      if (!route.compiled) {
        route.compile()
      }

      // Copy the list of matchers to a new array, so we can pop elements without
      // modifying the matchers
      let matchers = Array.prototype.slice.call(this.matchers)

      // Reverse, so we can push() and pop() from the list, and the matchers are
      // invoked FIFO rather then LIFO.
      matchers.reverse()

      // Construct the Match object, which stores the matched parameter values
      // and passes the route, request, and defaults to the matchers
      let match = new Match(req, route, Object.assign({query: {}}, route.defaults))

      // Invokes the matcher. The matcher invokes the function passed as the `next`
      // parameter if it hasn't matched and we should continue matching. If the matcher
      // found a match, it just returns without calling `next()` and sets Match.matched
      // to `true`.
      let next = async () => {
        let matcher = matchers.pop()

        if (typeof matcher === 'undefined') {
          return
        }

        return matcher(match, next)
      }

      // We start off the first matcher here, all further ones are invoked when
      // the matchers call next()
      await next()

      // We have a match, return the match so it can be acted upon, e.g. looking
      // for a controller to invoke
      if (match.matched) {
        return match
      }
    }
  }
}

// Matches the method and regexp pattern of the route object to the request
export async function defaultMatcher(match, next) {
  let {route, req} = match

  // If the method is configured on the route and the method doesn't match, then
  // return and continue looking for a matching route
  if (route.method && route.method !== req.method) {
    return next()
  }

  // Routes without a path can't be matched
  if (!route.path) {
    return next()
  }

  // Compile the route if it wasn't compiled before and we have access to the
  // route.pattern property
  if (!route.compiled) {
    route.compile()
  }

  let url = req.url
  let indexOfQuery = req.url.indexOf('?')

  // If a query string was found in the URL, then strip it from the URL so path matching happens
  // without the query string.
  if (indexOfQuery >= 0) {
    url = req.url.slice(0, indexOfQuery)
  }

  // Run the compiled RegExp on the request's URL
  let matches = route.pattern.exec(url)

  // No matches means the expression didn't match the URL. Keep looking for routes.
  if (!matches) {
    return next()
  }

  // Parse the query string into an object
  if (indexOfQuery >= 0) {
    match.parameters.query = querystring.parse(req.url.slice(indexOfQuery + 1))
  }

  // Get all the route's path parameters, for looping through them and match them
  // to their default values and values matched through the regular expression
  let keys = Object.keys(route.parameters)

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i]
    // This contains the position of the value within the matches array for the variable, e.g.
    // for a route "/hello/{name}" the parameters object contains the value "1" for the "name"
    // key.
    let pos = route.parameters[key]

    // If the was something matched at the position for the parameter and the value
    // isn't an empty string, then we found a value.
    if (typeof matches[pos] !== undefined && matches[pos] !== '') {
      match.parameters[key] = matches[pos]
    // Otherwise we write the default value to the matched parameters, if there is one
    } else {
      match.parameters[key] = route.defaults[key]
    }
  }

  // We matched something, this cancels the matching process. Also we don't call next()
  // here, so no other matchers are called after this one.
  match.matched = true
}
