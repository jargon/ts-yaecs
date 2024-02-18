import { Vector2D } from "../lib/geometry"
import { Component } from "../ecs/entity"
import { World } from "../ecs/ecs"
import { Rectangle } from "./shapes"
import { GameContext } from "./boot"
import { extractTextures, SpriteComponent } from "./graphics"
import { Position2D, Velocity2D } from "./physics.box2d"
import ship from "./assets/ship.png"
import bunny from "./assets/bunny.png"
import plate from "./assets/metal_tread_plate.jpg"

function sub<T extends Component>(component: T) {
    return component
}

export type ProgressCallback = (percentComplete: number, loaded: string) => void

export interface GameObject {
    components: Component[]
    tags: string[]
}

export interface Level {
    level: LevelComponent
    objects: GameObject[]
}

export interface LevelComponent extends Component {
    type: "level"
    graphicsScale: number
    gravity: Vector2D
}

function* getAllTextures(level: Level) {
    for (const obj of level.objects) {
        yield* extractTextures(obj.components)
    }
}

function loadTextures(world: World<GameContext>, level: Level, progress: ProgressCallback) {
    const { loader } = world.context
    return new Promise<void>((resolve) => {
        for (const texture of getAllTextures(level)) {
            loader.add(texture, texture)
        }

        loader.onProgress.add((loader: PIXI.Loader, resource: PIXI.LoaderResource) => {
            progress(loader.progress, resource.url)
        })

        loader.load(() => resolve())
    })    
}

export async function loadLevel(world: World<GameContext>, level: Level, progress: ProgressCallback) {
    await loadTextures(world, level, progress)
    world.addEntity([level.level])
    for (const obj of level.objects) {
        world.addEntity(obj.components, ...obj.tags)
    }
}

export const level: Level = {
    level: {
        type: "level",
        graphicsScale: 10,
        gravity: { x: 0, y: 10 }
    },
    objects: [
        {
            components: [
                sub<Position2D>({
                    type: "position",
                    position: { x: 10, y: 10 }
                }),
                sub<Velocity2D>({
                    type: "velocity",
                    velocity: { x: 10, y: 0 },
                    angularVelocity: 2
                }),
                sub<Rectangle>({
                    type: "shape",
                    shape: "rectangle",
                    center: { x: 0, y: 0 },
                    size: { hw: 10, hh: 10 },
                    physics: {
                        density: 5
                    },
                    graphics: {
                        texture: ship
                    }
                }),
                sub<SpriteComponent>({
                    type: "sprite",
                    texture: ship
                })
            ],
            tags: []
        },
        {
            components: [
                sub<Position2D>({
                    type: "position",
                    position: { x: 10, y: 40 }
                }),
                sub<Rectangle>({
                    type: "shape",
                    shape: "rectangle",
                    center: { x: 30, y: 10 },
                    size: { hw: 30, hh: 5 },
                    physics: {},
                    graphics: {
                        texture: plate,
                        tiling: true,
                        tilingScale: { x: 0.2, y: 0.2 }
                    }
                }),
                sub<SpriteComponent>({
                    type: "sprite",
                    texture: plate
                })
            ],
            tags: ["static"]
        }
    ]
}
