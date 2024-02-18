import { Container, Graphics, Sprite, Text, TextStyle, TilingSprite } from "pixi.js"
import { SystemFunc, World } from "../ecs/ecs"
import { Component } from "../ecs/entity"
import { Vector2D } from "../lib/geometry"
import { createLogger } from "../lib/log"
import { GameContext } from "./boot"
import { LevelComponent } from "./level"
import { Position2D } from "./physics.box2d"
import { isShape, Shape } from "./shapes"

const debug = true
const logger = createLogger("graphics")

export interface SpriteComponent extends Component {
    type: "sprite"
    texture: string
}

export interface Pixi extends Component {
    type: "pixi"
    object: PIXI.DisplayObject
}

/*
export interface Graphics extends Component {
    type: "graphics"
    visible: boolean
    alpha: number
}
*/

export interface Transform extends Component {
    type: "transform"
    skew: number
    scale: Vector2D
}

export function* extractTextures(components: Component[]) {
    for (const component of components) {
        if (isShape(component)) {
            yield component.graphics.texture
        }
    }
}

const spriteRenderer: SystemFunc<GameContext> = (world) => {
    const [ levelEntity ] = world.useQuery("level")
    const entities = world.useDeltaQuery("shape", "position")
    const { app, loader } = world.context
    
    const level = levelEntity.components.getOne("level") as LevelComponent
    const scale = level.graphicsScale
    for (const entity of entities.enter) {
        const position = entity.components.getOne("position") as Position2D
        const shapes = entity.components.getAll("shape") as Shape[]

        const root = new Container()
        app.stage.addChild(root)

        root.position.set(position.position.x * scale, position.position.y * scale)
        const sprites = shapes.map(s => createSprite(s, scale, loader.resources))
        sprites.forEach(s => root.addChild(s))

        const pixi: Pixi = {
            type: "pixi",
            object: root
        }
        entity.components.addOne(pixi)

        logger.debug(`Added PIXI container for entity ${entity.id} with ${sprites.length} sprites at position (${root.position.x}, ${root.position.y})`)
    }
    
    for (const entity of entities.exit) {
        const pixi = entity.components.getOne("pixi") as Pixi | undefined
        if (pixi) {
            app.stage.removeChild(pixi.object)
        }
    }
}

function createSprite(shape: Shape, scale: number, textures: PIXI.IResourceDictionary): PIXI.Sprite {
    const texture = textures[shape.graphics.texture].texture
    let sprite: PIXI.Sprite

    switch (shape.shape) {
        case "circle":
            sprite = new Sprite(texture)
            sprite.width = shape.radius * 2 * scale
            sprite.height = shape.radius * 2 * scale
            sprite.position.set(shape.center.x, shape.center.y)
            sprite.pivot.set(sprite.width / 2, sprite.height / 2)
            break
        case "rectangle":
            if (shape.graphics.tiling ?? false) {
                const tilingSprite = new TilingSprite(texture, shape.size.hw * 2 * scale, shape.size.hh * 2 * scale)
                if (shape.graphics.tilingScale) {
                    const scale = shape.graphics.tilingScale
                    tilingSprite.tileScale.set(scale.x, scale.y)
                }
                sprite = tilingSprite
            } else {
                sprite = new Sprite(texture)
                sprite.width = shape.size.hw * 2 * scale
                sprite.height = shape.size.hh * 2 * scale
            }
            logger.debug(`Sprite original size ${sprite.width}x${sprite.height} with texture size ${sprite.texture.width}x${sprite.texture.height}`)
            sprite.position.set(shape.center.x * scale, shape.center.y * scale)
            sprite.pivot.set(sprite.width / 2, sprite.height / 2)
            logger.debug(`Added sprite shaped as rectangle with parent position (${sprite.position.x}, ${sprite.position.y}), local pivot (${sprite.pivot.x}, ${sprite.pivot.y}), size ${sprite.width}x${sprite.height}, scale (${sprite.scale.x}x, ${sprite.scale.y}x)`)
            break
    }

    return sprite
}

function drawAxes(app: PIXI.Application): PIXI.Graphics {
    const lineWidth = 2
    const color = 0xff0000
    
    const width = app.view.width
    const height = app.view.height
    
    const graphics = new Graphics()
    graphics.lineStyle(lineWidth, color)

    // X-axis
    graphics.moveTo(0, 0).lineTo(width, 0)
    
    // Y-axis
    graphics.moveTo(0, 0).lineTo(0, height)
    
    for (let i = 10; i < width; i += 10) {
        const isBigMarker = i % 100 === 0
        const tickSize = isBigMarker ? 10 : 5

        // Ticks on X-axis
        graphics.moveTo(i, 0).lineTo(i, tickSize)

        // Ticks on Y-axis
        graphics.moveTo(0, i).lineTo(tickSize, i)

        if (isBigMarker) {
            const style = new TextStyle({
                fill: 0xff0000,
                stroke: 0xff0000
            })
            let tickNumber = new Text(i.toString(), style)
            tickNumber.tint = 0xff0000
            tickNumber.position.set(i, 10)
            app.stage.addChild(tickNumber)

            tickNumber = new Text("hej", style)
            tickNumber.position.set(10, i)
            app.stage.addChild(tickNumber)
        }
    }

    return graphics
}

const animator: SystemFunc<GameContext> = (world) => {
    const [ levelEntity ] = world.useQuery("level")
    const entities = world.useQuery("position", "pixi", "-static")

    const level = levelEntity.components.getOne("level") as LevelComponent
    const scale = level.graphicsScale

    for (const entity of entities) {
        const position = entity.components.getOne("position") as Position2D
        const pixi = entity.components.getOne("pixi") as Pixi

        pixi.object.position.set(position.position.x * scale, position.position.y * scale)
        pixi.object.rotation = position.angle ?? 0
    }
}

const transformer: SystemFunc<GameContext> = (world) => {
    const entities = world.useQuery("transform")

    for (const entity of entities) {
        const transform = entity.components.getOne("transform") as Transform
        const pixi = entity.components.getOne("pixi") as Pixi

        
    }
}

export function initialize(world: World<GameContext>) {
    world.addSystem("frame", "spriteRenderer", spriteRenderer)
    world.addSystem("frame", "animator", animator)
    //world.addSystem("frame", "transformer", transformer)

    if (debug) {
        const { app } = world.context
        const axes = drawAxes(app)
        app.stage.addChild(axes)
    }
}
