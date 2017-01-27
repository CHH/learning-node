export default (env) => {
    const config = {}

    if (env === 'dev') {
        config.watch = true
    }

    config.port = 4000

    return config
}
