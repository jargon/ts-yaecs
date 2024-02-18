import { World } from "../ecs/ecs"
import { GameContext } from "./boot"
import { level, loadLevel, ProgressCallback } from "./level"

const progress: ProgressCallback = (percentComplete, loaded) => {
    console.log(`Loading... ${percentComplete}% (${loaded})`)
}

export async function run(world: World<GameContext>) {
    await loadLevel(world, level, progress)
    gameLoop()
    
    function gameLoop() {
        world.run("frame")
        requestAnimationFrame(gameLoop)
    }
}
