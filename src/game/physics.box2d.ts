import { b2Body, b2BodyDef, b2BodyType, b2CircleShape, b2FixtureDef, b2PolygonShape, b2Shape, b2StepConfig } from "@box2d/core"
import { Vector2D } from "../lib/geometry"
import { SystemFunc, World } from "../ecs/ecs"
import { Component, Entity } from "../ecs/entity"
import { Shape } from "./shapes"
import { GameContext } from "./boot"
import { LevelComponent } from "./level"


export interface Position2D extends Component {
    type: "position"
    position: Vector2D
    angle?: number
}

export interface Velocity2D {
    type: "velocity"
    velocity: Vector2D
    angularVelocity: number
}

export interface Box2D extends Component {
    type: "box2d"
    body: b2Body
}

const lifecycle: SystemFunc<GameContext> = (world) => {
    const { engine } = world.context
    const entities = world.useDeltaQuery("position", "shape")

    for (const entity of entities.enter) {
        const position = entity.components.getOne("position") as Position2D
        const velocity = entity.components.getOne("velocity") as Velocity2D | undefined
        const shapes = entity.components.getAll("shape") as Shape[]
        
        const bodyDef: b2BodyDef = {
            "type": getBodyType(entity),

            "position": position.position,
            "angle": position.angle,
            
            "linearVelocity": velocity?.velocity,
            "angularVelocity": velocity?.angularVelocity,
            
            "bullet": entity.hasTag("bullet"),
            "fixedRotation": entity.hasTag("fixedRotation"),
        }
        
        console.log(`[physics] Adding entity to engine: ${entity.id} [body type: ${bodyDef.type}]`)
        const body = engine.CreateBody(bodyDef)

        for (const shape of shapes) {
            const { physics: { density, friction, restitution } } = shape
            const fixtureDef: b2FixtureDef = {
                "density": density,
                "friction": friction,
                "restitution": restitution,
                "shape": convertShape(shape)
            }
            console.log(`[physics] Adding fixture to body of type ${fixtureDef.shape.GetType()}`)
            body.CreateFixture(fixtureDef)
        }

        const box2d: Box2D = {
            type: "box2d",
            body
        }
        entity.components.addOne(box2d)
    }

    for (const entity of entities.exit) {
        console.log(`[physics] Removing entity from engine: ${entity.id}`)
        const box2d = entity.components.getOne("box2d") as Box2D | undefined
        if (box2d?.body) engine.DestroyBody(box2d.body)
        entity.components.removeOne("box2d")
    }
}

function getBodyType(entity: Entity) {
    if (entity.hasTag("static")) return b2BodyType.b2_staticBody
    if (entity.hasTag("kinematic")) return b2BodyType.b2_kinematicBody
    return b2BodyType.b2_dynamicBody
}

function convertShape(shape: Shape): b2Shape {
    if (shape.shape === "circle") {
        const circle = new b2CircleShape()
        circle.Set(shape.center, shape.radius)
        return circle
    } else if (shape.shape === "rectangle") {
        const box = new b2PolygonShape()
        box.SetAsBox(shape.size.hw, shape.size.hh, shape.center, shape.angle)
        return box
    }

    throw new Error("Unknown shape: " + shape)
}

const iterate: SystemFunc<GameContext> = (world) => {
    const { engine } = world.context
    const [ levelEntity ] = world.useQuery("level")
    const [iteration, setIteration] = world.useState(0)
    const [gravity, setGravity] = world.useState<Vector2D>()

    if (iteration >= 600) {
        console.log(`[physics] Performed ${iteration} iterations`)
        setIteration(0)
    } else {
        setIteration(iteration + 1)
    }

    const level = levelEntity.components.getOne("level") as LevelComponent
    if (gravity !== level.gravity) {
        console.log(`Updating gravity vector to (${level.gravity.x}, ${level.gravity.y})`)
        engine.SetGravity(level.gravity)
        setGravity(level.gravity)
    }

    const stepConfig: b2StepConfig = {
        positionIterations: 6,
        velocityIterations: 6
    }
    engine.Step(1/60, stepConfig)
}

const update: SystemFunc<GameContext> = (world) => {
    const entities = world.useQuery("position", "box2d", "-static")

    for (const entity of entities) {
        const position = entity.components.getOne("position") as Position2D
        const box2d = entity.components.getOne("box2d") as Box2D
        
        const physPos = box2d.body.GetPosition()
        const angle = box2d.body.GetAngle()

        position.position.x = physPos.x
        position.position.y = physPos.y
        position.angle = angle
    }
}

export function initialize(world: World<GameContext>) {
    world.addSystem("frame", "lifecycle", lifecycle)
    world.addSystem("frame", "iterate", iterate)
    world.addSystem("frame", "update", update)
}
