export class Container {
  constructor(values = {}) {
    this.values = new Map()
    this.raw = new Map()
    this.keys = new Map()
    this.factories = new Set()

    for (let key of Object.keys(values)) {
      this.set(key, values[key])
    }
  }

  set(id, raw) {
    this.raw.delete(id)
    this.values.set(id, raw)
    this.keys.set(id, true)
  }

  keys() {
    return this.keys.entries()
  }

  has(id) {
    return this.keys.has(id)
  }

  getRaw(id) {
    if (this.raw.has(id)) {
      return this.raw.get(id)
    }

    return this.values.get(id)
  }

  extend(id, asyncFn) {
    if (!this.keys.has(id)) {
      throw new Error('Invalid service ID')
    }

    let factory = this.values.get(id)
    let extended = async (container) => {
      return asyncFn(await factory(container), container)
    }

    if (this.factories.has(factory)) {
      this.factories.delete(factory)
      this.factories.add(extended)
    }

    return this.set(id, extended)
  }

  async get(id) {
    if (!this.keys.has(id)) {
      throw new Error('Invalid service ID')
    }

    if (this.raw.has(id) || typeof this.values.get(id).call !== 'function') {
      return this.values.get(id)
    }

    if (this.factories.has(this.values.get(id))) {
      return this.values.get(id)(this)
    }

    let raw = this.values.get(id)
    this.values.set(id, await raw(this))
    this.raw.set(id, raw)

    return this.values.get(id)
  }

  async register(provider, values = {}) {
    await provider.register(this)

    for (let key of Object.keys(values)) {
      this.set(key, values[key])
    }

    return this
  }
}
