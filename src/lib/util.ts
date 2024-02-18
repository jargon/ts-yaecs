export type Enum<E> = Record<keyof E, number | string> & { [k: number]: keyof E }

export function* iterate<E extends Enum<E>>(enumType: E) {
    for (const val in enumType) {
        if (!isNaN(Number(val))) yield val
    }
}

export function defer(task: () => void) {
    queueMicrotask(task)
}

export function arrayEq(xs: any[], ys: any[]) {
    if (xs.length !== ys.length) return false
    return xs.every((el, i) => el === ys[i])
}

export function partition<T>(xs: T[], ys: T[], eq: (x: T, y: T) => boolean) {
    const xsMinusYs = []
    const ysMinusXs = []
    const intersection = []
    for (const x of xs) {
        let match = false
        for (const y of ys) {
            if (eq(x, y)) {
                intersection.push(x)
                match = true
                break
            }
        }
        if (!match) {
            xsMinusYs.push(x)
        }
    }
    for (const y of ys) {
        let match = false
        for (const x of xs) {
            if (eq(y, x)) {
                match = true
                break
            }
        }
        if (!match) {
            ysMinusXs.push(y)
        }
    }
    return [xsMinusYs, intersection, ysMinusXs]
}
