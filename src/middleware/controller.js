import path from 'path'

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// A function which creates a middleware function to invoke a controller function
// if a route could be matched and the route has a controller configured.
export default function controller(container) {
  return async (context, next) => {
    let paths = await container.get('paths')
    // This will contain a function to invoke with the request and response objects, as well
    // as all parameters of the route
    //
    // Example:
    //
    //     function handle(req, res, parameters) {}
    //
    // Or when you want to get a specific route parameter you can use object destructuring:
    //
    //     function handle(req, res, {name})
    let controller

    // If the router hasn't set anything on the request object, then pass that request
    // on to the next middleware function in the chain.
    if (typeof context.get('route') === undefined) {
      return next()
    }

    let route = context.get('route')
    let parameters = context.get('parameters')

    // If the route has no controller attached, then pass the request on to the next middleware
    // function in the chain.
    if (typeof parameters._controller === 'undefined') {
      return next()
    }

    if (typeof parameters._controller === 'string') {
      // If the controller is an ID in the form of "controller:action", then create the module
      // name by capitalizing the first character, then attempt to load a module with that
      // name from the controllers directory. The default export is used as a constructor
      // and the method is used as the controller function.
      let [controllerName, actionName] = parameters._controller.split(':')
      let moduleName = capitalize(controllerName) + 'Controller'
      let instance

      context.set('controllerName', controllerName)
      context.set('actionName', actionName)

      if (container.has(`controller.${controllerName}`)) {
        instance = await container.get(`controller.${controllerName}`)
      } else {
        try {
          let klass = require(path.resolve(paths.controllers, moduleName)).default
          instance = new klass()
        } catch (error) {
          console.error(`Error loading module ${moduleName} for controller ${parameters._controller}`)
          res.writeHead(404)
          res.end('Not found')
          return
        }
      }

      if (typeof instance[actionName+'Action'] === 'undefined') {
        return next()
      }

      if (typeof instance['setContainer'] !== 'undefined') {
        instance.setContainer(container)
      }

      controller = instance[actionName+'Action'].bind(instance)
    } else if (typeof parameters._controller === 'function') {
      // If the route's controller parameter is a plain function, then use that function
      // directly as a controller and run it
      controller = parameters._controller
    }

    return controller(context, parameters)
  }
}
