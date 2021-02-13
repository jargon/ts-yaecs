import "mocha"
import { expect } from "chai"
import { useState, createContext, reset, useEffect, useMemo } from "../src/ecs/hooks"

describe("hooks.ts", () => {
    describe("#reset", () => {
        describe("when called on context with incremented current index", () => {
            it("it will reset the index to 0", () => {
                const context = createContext()
                context.currentIndex = 5
                reset(context)
                expect(context.currentIndex).to.equal(0)
            })
        })
    })
    describe("#useState", () => {
        describe("when called from a function multiple times", () => {
            it("it returns previously set state", () => {
                const context = createContext()
                const counter = () => {
                    const [count, setCount] = useState(context, 0)
                    setCount(count + 1)
                    return count
                }
                expect(counter()).to.equal(0)
                reset(context)
                expect(counter()).to.equal(1)
                reset(context)
                expect(counter()).to.equal(2)
            })
        })
        describe("when called for falsey state", () => {
            it("it will not revert to initial state", () => {
                const context = createContext()
                const toggle = () => {
                    const [value, setValue] = useState(context, true)
                    setValue(!value)
                    return value
                }
                expect(toggle()).to.be.true
                reset(context)
                expect(toggle()).to.be.false
                reset(context)
                expect(toggle()).to.be.true
            })
        })
        describe("when using multiple pieces of state", () => {
            it("they will not interfere with each other", () => {
                const context = createContext()
                const togglingCounter = () => {
                    const [count, setCount] = useState(context, 0)
                    const [flip, setFlip] = useState(context, false)

                    setCount(count + 1)
                    setFlip(!flip)

                    return [count, flip]
                }
                let [count, flip] = togglingCounter()
                expect(count).to.equal(0)
                expect(flip).to.be.false

                reset(context);
                ([count, flip] = togglingCounter())
                expect(count).to.equal(1)
                expect(flip).to.be.true

                reset(context);
                ([count, flip] = togglingCounter())
                expect(count).to.equal(2)
                expect(flip).to.be.false
            })
        })
        describe("when calling state setter", () => {
            it("it returns the new value", () => {
                const context = createContext()
                const counter = () => {
                    const [count, setCount] = useState(context, 0)
                    return setCount(count + 1)
                }
                expect(counter()).to.equal(1)
                reset(context)
                expect(counter()).to.equal(2)
            })
        })
    })
    describe("#useEffect", () => {
        describe("when called from a function multiple times with same deps", () => {
            it("it will not rerun the effect", () => {
                const context = createContext()
                const effectCounter = (dep: number) => {
                    const [count, setCount] = useState(context, 0)
                    useEffect(context, () => {
                        setCount(count + 1)
                    }, [dep])
                    return count
                }
                expect(effectCounter(1)).to.equal(0)
                reset(context)
                expect(effectCounter(1)).to.equal(1)
                reset(context)
                expect(effectCounter(1)).to.equal(1)
                reset(context)
                expect(effectCounter(1)).to.equal(1)

                reset(context)
                expect(effectCounter(2)).to.equal(1)
                reset(context)
                expect(effectCounter(2)).to.equal(2)
                reset(context)
                expect(effectCounter(2)).to.equal(2)
            })
        })
        describe("when effect returns a cleanup function", () => {
            it("it will be run when deps change", () => {
                const context = createContext()
                let cleanedUp = false
                const doCleanup = (dep: number) => {
                    useEffect(context, () => {
                        return () => cleanedUp = true
                    }, [dep], false)
                }
                doCleanup(0)
                expect(cleanedUp).to.be.false
                reset(context)
                doCleanup(0)
                expect(cleanedUp).to.be.false
                reset(context)
                doCleanup(1)
                expect(cleanedUp).to.be.true
                reset(context)
            })
        })
    })
    describe("#useMemo", () => {
        describe("when called with a function", () => {
            it("it will return the result of calling that function", () => {
                const context = createContext()
                const memorize = () => {
                    return useMemo(context, () => 5, [])
                }
                expect(memorize()).to.equal(5)
                reset(context)
                expect(memorize()).to.equal(5)
            })
        })
        describe("when called multiple times with same deps", () => {
            it("it will not call the function again", () => {
                const context = createContext()
                const remember = () => {
                    const [count, setCount] = useState(context, 0)
                    return useMemo(context, () => {
                        return setCount(count + 1)
                    }, [])
                }
                expect(remember()).to.equal(1)
                reset(context)
                expect(remember()).to.equal(1)
            })
        })
        describe("when called with different deps", () => {
            it("it will call the function again", () => {
                const context = createContext()
                const fibonacci = (current: number) => {
                    const [prev, setPrev] = useState(context, 1)
                    const fib = (cur: number) => {
                        const next = prev + setPrev(cur)
                        return next
                    }
                    return useMemo(context, fib, [current])
                }
                expect(fibonacci(1)).to.equal(2)
                reset(context)
                expect(fibonacci(2)).to.equal(3)
                reset(context)
                expect(fibonacci(3)).to.equal(5)
            })
        })
    })
})