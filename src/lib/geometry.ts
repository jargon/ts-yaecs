export interface Vector2D {
    x: number
    y: number
}

export interface AABB {
    readonly min: Vector2D
    readonly max: Vector2D
}

export interface Shape {
    readonly bounds: AABB
}

export const intersects = (a: AABB, b: AABB): boolean => {
    return a.max.x > b.min.x && a.min.x < b.max.x &&
        a.max.y > b.min.y && a.min.y < b.max.y
}
