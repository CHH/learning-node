import http from 'http'
import fs from 'fs-promise'
import path from 'path'
import crypto from 'crypto'
import nunjucks from 'nunjucks'
import controller from './middleware/controller'
import Container from './container'
import {Stack} from './middleware'
import Router from './routing'
import RouteCollection from './routing/route-collection'
import Context from './context'

// Creates an app and is the public API of the package
export function createApp(values) {
  return new App(values)
}

// The App class maintains all services and the default framework setup.
// It extends from the Container to provide facilities to manage service instances.
class App extends Container {
  constructor(values = {}) {
    super()

    // Hot reloading is off by default, will be turned on by NODE_ENV=dev
    this.set('watch', false)
    // The default port, that is used for listening for requests by default
    this.set('port', 8000)

    // The middleware stack. Implements routing and invoking controller classes by default.
    // Extend here to add your own middleware. A helper function to make this easier is left
    // as an exercise to the reader.
    this.set('stack', async (container) => {
      const stack = new Stack()
      const router = await container.get('router')

      stack.push(router.middleware())
      stack.push(controller(this))

      return stack
    })

    // Loads the route config, remove this service to disable loading the config file.
    this.set('router.routes', async (container) => {
      const paths = await container.get('paths')
      const routes = new RouteCollection()
      const config = require(path.resolve(paths.config, 'routes')).default
      config(container, routes)

      return routes
    })

    // Initializes the router. Extend here to add your own routes.
    this.set('router', async (container) => {
      let routes

      if (container.has('router.routes')) {
        routes = await container.get('router.routes')
      }

      return new Router(routes)
    })

    // Initializes the default framework paths for controllers, configs, and views. Extend
    // here to customize the paths to these files.
    this.set('paths', async (container) => {
      let root = await container.get('root')
      return {
        controllers: path.resolve(root, 'controllers'),
        views: path.resolve(root, 'views'),
        config: path.resolve(root, 'config')
      }
    })

    // Loads nunjucks HTML templates from the filesystem.
    this.set('view.loader', async (container) => {
      let paths = await container.get('paths')

      return new nunjucks.FileSystemLoader(paths.views)
    })

    // Returns the nunjucks environment. Extend here to add your own nunjucks extensions.
    this.set('view', async (container) => {
      return new nunjucks.Environment(await container.get('view.loader'))
    })

    // Allows overriding existing services through the constructor.
    let keys = Object.keys(values)

    for (let i = 0; i < keys.length; i++) {
      this.set(keys[i], values[keys[i]])
    }
  }

  // Helper method to add middleware
  use(middleware, mode = 'append') {
    this.extend('stack', async (stack, container) => {
      if (mode === 'append') {
        stack.push(middleware)
      } else if (mode === 'prepend') {
        stack.unshift(middleware)
      }

      return stack
    })

    return this
  }

  // Starts the http server
  async start() {
    console.log("Starting server")

    const root = await this.get('root')
    const paths = await this.get('paths')
    const stack = await this.get('stack')

    const server = http.createServer(async (req, res) => {
      const context = new Context({req, res, container: this})

      try {
        await stack.run(context)

        if (!context.res.finished) {
          context.res.writeHead(404)
          context.res.end()
          return
        }
      } catch (error) {
        console.log(error)
        context.res.writeHead(500)
        context.res.end()
      }
    })

    const port = await this.get('port')

    server.listen(port, () => {
      console.log(`Listening on port ${port}`)
    })
  }
}
