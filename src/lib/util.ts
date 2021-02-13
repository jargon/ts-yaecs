export type Enum<E> = Record<keyof E, number | string> & { [k: number]: keyof E }

export function* iterate<E extends Enum<E>>(enumType: E) {
    for (const val in enumType) {
        if (!isNaN(Number(val))) yield val
    }
}

export function defer(task: () => void) {
    queueMicrotask(task)
}

export function arrayEq(x: any[], y: any[]) {
    if (x.length !== y.length) return false
    return x.every((el, i) => el === y[i])
}
