import querystring from 'querystring'

export default class FormData {
  constructor(req) {
    this.req = req
    this.parsed = false
    this.data = {}
  }

  async get(key) {
    let data = await this.parse()

    return data[key]
  }

  async parse() {
    if (this.parsed) {
      return this.data
    }

    return new Promise((resolve, reject) => {
      let body = ''

      this.req.setEncoding('utf8')

      this.req.on('readable', () => {
        let buf = this.req.read()

        if (buf === null) {
          this.data = querystring.parse(body)
          this.parsed = true

          resolve(this.data)
        } else {
          body += buf
        }
      })
    })
  }
}
