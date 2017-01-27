// function matchRoute(match, next)

export async function matchMethod(match, next) {
  if (match.route.method && match.route.method === match.req.method) {
    match.matched = true
    return
  }

  return next()
}

export async function matchPath(match, next) {
  let {route, req} = match

  console.log(route.path)

  if (!route.path) {
    return next()
  }

  let matches = route.pattern.exec(req.url)

  if (!matches) {
    return next()
  }

  let keys = Object.keys(route.vars)

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i]

    if (typeof matches[pos] !== undefined && matches[pos] !== '') {
      match.vars[key] = matches[pos]
    } else {
      match.vars[key] = route.defaults[key]
    }
  }

  match.matched = true
}
