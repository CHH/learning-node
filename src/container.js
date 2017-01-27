export default class Container {
  constructor(values = {}) {
    this.values = new Map()
    this.raw = new Map()
    this.keys = new Map()

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

  async get(id) {
    if (!this.keys.has(id)) {
      throw new Error('Invalid service ID')
    }

    if (this.raw.has(id) || typeof this.values.get(id).call !== 'function') {
      return this.values.get(id)
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
