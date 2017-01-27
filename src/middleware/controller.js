import path from 'path'

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function controller(app) {
  return async (req, res, next) => {
    let paths = await app.get('paths')
    let controller

    if (typeof req.context.router === undefined || typeof req.context.router.match === 'undefined') {
      return next()
    }

    let match = req.context.router.match

    if (typeof match.vars._controller === 'undefined') {
      return next()
    }

    if (typeof match.vars._controller === 'string') {
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
      controller = match.vars._controller
    }

    return controller(req, res, match.vars)
  }
}
