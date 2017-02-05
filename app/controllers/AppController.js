export default class AppController {
  setContainer(container) {
    this.container = container
  }

  async get(service) {
    return this.container.get(service)
  }
}
