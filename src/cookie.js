import cookie from 'cookie'

export default class CookieData {
  constructor(req) {
    this.req = req
    this.data = {}
    this.parsed = false
  }

  async get(key) {
    let data = await this.parse()
    return data[key]
  }

  async parse() {
    if (!this.parsed) {
      this.data = cookie.parse(this.req.headers.cookie || '')
      this.parsed = true
    }

    return this.data
  }
}
