import http from 'http'
import fs from 'fs-promise'
import path from 'path'
import crypto from 'crypto'
import nunjucks from 'nunjucks'
import html from './middleware/html'
import controller from './middleware/controller'
import {Container} from './container'
import {Stack} from './middleware'
import {Router} from './routing'

export function createApp(values) {
  return new App(values)
}

class App extends Container {
  constructor(values = {}) {
    super()

    this.set('watch', false)
    this.set('port', 8000)

    this.set('stack', async (container) => {
      let stack = new Stack()
      let router = await container.get('router')

      stack.push(html())
      stack.push(router.middleware())
      stack.push(controller(this))

      return stack
    })

    this.set('router', async (container) => {
      let paths = await container.get('paths')
      let router = new Router()
      let config = require(path.resolve(paths.config, 'routes')).default

      config(router.routes)

      return router
    })

    this.set('paths', async (container) => {
      let root = await container.get('root')
      return {
        controllers: path.resolve(root, 'controllers'),
        views: path.resolve(root, 'views'),
        config: path.resolve(root, 'config')
      }
    })

    this.set('view.loader', async (container) => {
      let [paths, watch] = await Promise.all([
        container.get('paths'),
        container.get('watch'),
      ])

      return new nunjucks.FileSystemLoader(paths.views, {
        watch: watch
      })
    })

    this.set('view', async (container) => {
      return new nunjucks.Environment(await container.get('view.loader'))
    })

    for (let key of Object.keys(values)) {
      this.set(key, values[key])
    }
  }

  async start() {
    console.log("Starting server")

    let root = await this.get('root')
    let paths = await this.get('paths')

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

          let router = this.getRaw('router')
          this.set('router', router)

          let stack = this.getRaw('stack')
          this.set('stack', stack)
        }
      })
    }

    let stack = await this.get('stack')

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
