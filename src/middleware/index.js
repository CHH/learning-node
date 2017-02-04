export class Stack {
  constructor() {
    this.stack = []
  }

  // Puts middleware to the end of the stack
  push(middleware) {
    this.stack.push(middleware)
  }

  // Puts middleware to the front of the stack
  unshift(middleware) {
    this.stack.unshift(middleware)
  }

  // Runs all the middleware functions
  async run(context) {
    // Copy the stack to a new array so we don't modify the list of registered functions
    let stack = Array.prototype.slice.call(this.stack)
    // Reverse the order of the array so we can use pop() and the functions are run FIFO
    stack.reverse()

    // Runs the next middleware function
    let next = async () => {
      let middleware = stack.pop()

      // If the result of pop() is undefined there are no elements left in the array
      if (typeof middleware !== 'undefined') {
        // All middleware functions are async so they can make use of await.
        // next() is async itself, so it's awaited anyway somewhere. Don't make an redundant await here.
        return middleware(context, next)
      }
    }

    // Return here. Because all async functions always return promises and run() gets
    // awaited in the parent function anyway, an explicit await here would be redundant.
    return next()
  }
}
