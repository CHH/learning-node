import path from 'path'

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// A function which creates a middleware function to invoke a controller function
// if a route could be matched and the route has a controller configured.
export default function controller(app) {
  return async (req, res, next) => {
    let paths = await app.get('paths')
    // This will contain a function to invoke with the request and response objects, as well
    // as all parameters of the route
    //
    // Example:
    //
    //     function handle(req, res, vars) {}
    //
    // Or when you want to get a specific route parameter you can use object destructuring:
    //
    //     function handle(req, res, {name})
    let controller

    // If the router hasn't set anything on the request object, then pass that request
    // on to the next middleware function in the chain.
    if (typeof req.context.router === undefined || typeof req.context.router.match === 'undefined') {
      return next()
    }

    let match = req.context.router.match

    // If the route has no controller attached, then pass the request on to the next middleware
    // function in the chain.
    if (typeof match.vars._controller === 'undefined') {
      return next()
    }

    if (typeof match.vars._controller === 'string') {
      // If the controller is and ID in the form of "controller:action", then create the module
      // name by capitalizing the first character, then attempt to load a module with that
      // name from the controllers directory. The default export is used as a constructor
      // and the method is used as the controller function.
      let [controllerName, actionName] = match.vars._controller.split(':')
      let moduleName = capitalize(controllerName) + 'Controller'
      let instance

      try {
        let klass = require(path.resolve(paths.controllers, moduleName)).default
        instance = new klass(app)
      } catch (error) {
        console.error(`Error loading module ${moduleName} for controller ${match.vars._controller}`)
        res.writeHead(404)
        res.end('Not found')
        return
      }

      if (typeof instance[actionName+'Action'] === 'undefined') {
        return next()
      }

      controller = instance[actionName+'Action'].bind(instance)
    } else if (typeof match.vars._controller === 'function') {
      // If the controller is a plain function, then use that function directly.
      controller = match.vars._controller
    }

    return controller(req, res, match.vars)
  }
}
