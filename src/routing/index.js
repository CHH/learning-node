import RequestMatcher from './matcher'
import UrlGenerator from './generator'
import RouteCollection from './route-collection'

export default class Router {
  constructor(routes = new RouteCollection()) {
    this.routes = routes
    this.generator = new UrlGenerator(this.routes)
    this.matcher = new RequestMatcher(this.routes)
  }

  middleware() {
    return async (context, next) => {
      let {req} = context
      let match = await this.matcher.match(req)

      if (typeof match !== 'undefined') {
        context.set('route', match.route)
        context.set('parameters', match.parameters)
      }

      return next()
    }
  }

  // Generate a path for a route, given the parameters, using the UrlGenerator
  generate(name, parameters = {}) {
    return this.generator.generate(name, parameters)
  }
}
