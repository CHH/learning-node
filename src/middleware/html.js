export default function html() {
  return async ({res}, next) => {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'text/html')
    }

    return next()
  }
}
