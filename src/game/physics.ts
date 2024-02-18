import { Vector2D } from "../lib/geometry"
import { Component, Entity } from "../ecs/entity"
import { SystemFunc, World } from "../ecs/ecs"
import { GameContext } from "./boot"

export interface PhysicsLaws extends Component {
    type: "physicsLaws"
    g: number
    drag: number
}

export interface Position2D extends Component, Vector2D {
    type: "position"
}

export interface Physics2D {
    type: "physics"
    velocity: Vector2D
    force: Vector2D

    mass: number
}

export interface Collision {
    collider: Entity
    delta: Vector2D
    normal: Vector2D
}
export interface Collisions {
    type: "collisions"
    collisions: Collision[]
}

const createLaws = (): PhysicsLaws => {
    return {
        type: "physicsLaws",
        g: 9.8,
        drag: 0
    }
}

const gravity: SystemFunc<GameContext> = (world) => {
    const [ lawsEntity ] = world.useQuery("physicsLaws")
    const laws = lawsEntity.components.getOne("physicsLaws") as PhysicsLaws
    const entities = world.useQuery("physics")

    for (const entity of entities) {
        const physics = entity.components.getOne("physics") as Physics2D
        physics.force.y += physics.mass * laws.g
    }
}

const warp: SystemFunc<GameContext> = (world) => {
    const { app } = world.context
    const entities = world.useQuery("position")

    for (const entity of entities) {
        const position = entity.components.getOne("position") as Position2D
        if (position.y > app.view.height) {
            position.y = 0
        }
    }
}

const iterate: SystemFunc<GameContext> = (world) => {
    const { ticker } = world.context
    const dt = ticker.deltaMS / 1000
    const entities = world.useQuery("position", "physics")

    for (const entity of entities) {
        const pos = entity.components.getOne("position") as Position2D
        const physics = entity.components.getOne("physics") as Physics2D

        semiImplicitEuler(pos, physics, dt)
    }
}

const semiImplicitEuler = (pos: Position2D, physics: Physics2D, dt: number) => {
    const { x, y } = pos
    let { x: vx, y: vy } = physics.velocity
    const { x: fx, y: fy } = physics.force
    const m = physics.mass

    // Calculate acceleration
    const ax = fx / m
    const ay = fy / m

    // Calculate new velocity
    physics.velocity.x = vx = vx + ax * dt
    physics.velocity.y = vy = vy + ay * dt

    // Calculate new position
    pos.x = x + vx * dt
    pos.y = y + vy * dt

    // Reset force
    physics.force.x = 0
    physics.force.y = 0
}

export function initialize(world: World<GameContext>) {
    world.addSystem("frame", "gravity", gravity)
    world.addSystem("frame", "warp", warp)
    world.addSystem("frame", "iterate", iterate)
    world.addEntity([createLaws()])
}
