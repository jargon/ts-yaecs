import { Level, setLogLevel } from "../lib/log"
import { createWorld } from "../ecs/ecs"
import { run } from "./game"
import { initialize as initGraphics } from "./graphics"
import { initialize as initPhysics } from "./physics.box2d"

export interface GameContext {
    app: PIXI.Application
    loader: PIXI.Loader
    ticker: PIXI.Ticker
    engine: import("@box2d/core").b2World
}

export const bootstrap = async () => {
    const { Application } = await import("pixi.js")
    const { b2World } = await import("@box2d/core")

    setLogLevel(Level.Debug)

    const app = new Application({
        width: 800,
        height: 600,
        resolution: window.devicePixelRatio ?? 1
    })
    document.getElementById("container")?.appendChild(app.view)
    
    const defaultGravity = { x: 0, y: -10 }
    const engine = b2World.Create(defaultGravity)

    const world = createWorld<GameContext>({ app, loader: app.loader, ticker: app.ticker, engine })
    initGraphics(world)
    initPhysics(world)

    await run(world)
}
