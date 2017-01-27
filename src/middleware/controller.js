import path from 'path'

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function controller(app) {
  return async (req, res, next) => {
    let paths = await app.get('paths')

    if (typeof req.context.router === undefined || typeof req.context.router.match === 'undefined') {
      return next()
    }

    let match = req.context.router.match

    if (typeof match.vars._controller === 'undefined') {
      return next()
    }

    let [controllerName, actionName] = match.vars._controller.split(':')
    let moduleName = capitalize(controllerName) + 'Controller'

    try {
      let klass = require(path.resolve(paths.controllers, moduleName)).default
      let instance = new klass(app)

      return instance[actionName+'Action'](req, res, match.vars)
    } catch (error) {
      console.error(`Error loading module ${moduleName} for controller ${match.vars._controller}`)
      res.writeHead(404)
      res.end('Not found')
    }
  }
}
