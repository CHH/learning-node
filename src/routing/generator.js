export default class UrlGenerator {
  constructor(routes) {
    this.routes = routes
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
