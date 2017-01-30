import _mkdirp from 'mkdirp'

export default async function mkdirp(path, opts) {
  return new Promise((resolve, reject) => {
    _mkdirp(path, opts, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
