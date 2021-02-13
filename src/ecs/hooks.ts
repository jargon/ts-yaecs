import { arrayEq, defer } from "../lib/util"

export interface HooksContext {
    hooks: any[]
    cleanup: CleanupFunc[]
    currentIndex: number
}

export type UseStateResult<T> = [value: T, setValue: (value: T) => T]
export type CleanupFunc = () => void

export function useState<T>(context: HooksContext, initialValue?: T): UseStateResult<T> {
    const hooks = context.hooks
    const initIndex = context.currentIndex++
    const stateIndex = context.currentIndex++

    const initialized = hooks[initIndex] === true

    if (!initialized) {
        hooks[initIndex] = true
        hooks[stateIndex] = initialValue
    }

    const state = hooks[stateIndex]
    const setState = (newState: T) => hooks[stateIndex] = newState
    return [state, setState]
}

export function useEffect(context: HooksContext, callback: () => CleanupFunc | void, dependencies?: any[], deferCleanup = true) {
    const hooks = context.hooks
    const depsIndex = context.currentIndex++
    const cleanupIndex = context.currentIndex++

    const newDeps = dependencies
    const oldDeps = hooks[depsIndex]
    const oldCleanup = hooks[cleanupIndex]

    const hasChangedDeps = (newDeps && oldDeps) ? !arrayEq(newDeps, oldDeps) : true

    if (hasChangedDeps) {
        const newCleanup = callback()
        hooks[depsIndex] = newDeps

        if (typeof newCleanup === "function") {
            hooks[cleanupIndex] = newCleanup
            context.cleanup.push(newCleanup)
        } else {
            hooks[cleanupIndex] = undefined
        }

        if (typeof oldCleanup === "function") {
            const idx = context.cleanup.findIndex(fn => fn === oldCleanup)
            context.cleanup.splice(idx, 1)
            
            if (deferCleanup) defer(oldCleanup)
            else oldCleanup()
        }
    }
}

export function useMemo<T extends (...args: any[]) => any>(context: HooksContext, factory: T, params: Parameters<T>): ReturnType<T> {
    let [result, setResult] = useState<ReturnType<T>>(context)

    useEffect(context, () => {
        const newResult = factory(...params)
        if (newResult !== result) {
            result = newResult
            setResult(newResult)
        }
    }, params)

    return result
}

export const createContext = (): HooksContext => ({ hooks: [], cleanup: [], currentIndex: 0 })
export const reset = (context: HooksContext) => context.currentIndex = 0

export const retire = (context: HooksContext) => {
    // Run remaining effect cleanups
    context.cleanup.forEach(fn => defer(fn))

    // Empty context
    context.hooks = []
    context.cleanup = []
    context.currentIndex = 0
}
