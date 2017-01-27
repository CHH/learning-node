export class Stack {
    constructor() {
        this.stack = []
    }

    push(middleware) {
        this.stack.push(middleware)
    }

    unshift(middleware) {
        this.stack.unshift(middleware)
    }

    async run(req, res) {
        let stack = Array.prototype.slice.call(this.stack)
        stack.reverse()
        req.context = {}

        let next = async (req, res) => {
            let middleware = stack.pop()

            if (typeof middleware !== 'undefined') {
                await middleware(req, res, next)
            }
        }

        await next(req, res)
    }
}
