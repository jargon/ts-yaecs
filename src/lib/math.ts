export const EPSILON = 1e-8

export const abs = Math.abs

export const sign = Math.sign

export function clamp(value: number, min: number, max: number) {
    if (value < min) return min
    if (value > max) return max
    return value
}
