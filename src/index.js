import http from 'http'
import fs from 'fs-promise'
import path from 'path'
import crypto from 'crypto'
import nunjucks from 'nunjucks'
import html from './middleware/html'
import controller from './middleware/controller'
import {Container} from './container'
import {Stack} from './middleware'
import {Router, RouteCollection} from './routing'

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
      let stack = new Stack()
      let router = await container.get('router')

      stack.push(html())
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
      let [paths, watch] = await Promise.all([
        container.get('paths'),
        container.get('watch'),
      ])

      return new nunjucks.FileSystemLoader(paths.views, {
        watch: watch
      })
    })

    // Returns the nunjucks environment. Extend here to add your own nunjucks extensions.
    this.set('view', async (container) => {
      return new nunjucks.Environment(await container.get('view.loader'))
    })

    // Allows overriding existing services through the constructor.
    for (let key of Object.keys(values)) {
      this.set(key, values[key])
    }
  }

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

    let root = await this.get('root')
    let paths = await this.get('paths')
    let stack = await this.get('stack')

    if (await this.get('watch')) {
      console.log(`Watching ${root} for changes`)
      let hashes = new Map()
      let controllers = await fs.readdir(paths.controllers)

      for (let controller of controllers) {
        let filename = path.resolve(paths.controllers, controller)
        let hash = crypto.createHash('sha1')

        hash.update(await fs.readFile(filename))
        hashes.set(filename, hash.digest('hex'))
      }

      console.log(hashes)

      fs.watch(paths.controllers, async (eventType, filename) => {
        let abs = path.resolve(paths.controllers, filename)
        let hash = crypto.createHash('sha1')
        hash.update(await fs.readFile(abs))
        let digest = hash.digest('hex')

        if (digest !== hashes.get(abs)) {
          console.log(`Reloading controller ${filename}`)
          hashes.set(abs, digest)
          delete require.cache[abs]
        }
      })

      fs.watch(paths.config, async (eventType, filename) => {
        console.log(`Reloading config ${filename}`)

        if (filename === 'routes.js') {
          delete require.cache[path.resolve(paths.config, filename)]

          this.set('router.routes', this.getRaw('router.routes'))
          this.set('router', this.getRaw('router'))
          this.set('stack', this.getRaw('stack'))

          stack = await this.get('stack')
        }
      })
    }

    const server = http.createServer(async (req, res) => {
      try {
        await stack.run(req, res)

        if (!res.finished) {
          res.writeHead(404)
          res.end()
          return
        }
      } catch (error) {
        console.log(error)
        res.writeHead(500)
        res.end()
      }
    })

    let port = await this.get('port')

    console.log(`Listening on port ${port}`)
    server.listen(port)
  }
}
