import { RectangleSize, Vector2D } from "../lib/geometry"
import { Component } from "../ecs/entity"

export interface BaseShape extends Component {
    type: "shape"
    center: Vector2D
    physics: {
        density?: number
        friction?: number
        restitution?: number
    }
    graphics: {
        texture: string
        tiling?: boolean
        tilingScale?: Vector2D
    }
}

export interface Circle extends BaseShape {
    shape: "circle"
    radius: number
}

export interface Rectangle extends BaseShape {
    shape: "rectangle"
    size: RectangleSize
    angle?: number
}

export type Shape = Circle | Rectangle

export function isShape(component: Component): component is Shape {
    return component.type === "shape"
}
