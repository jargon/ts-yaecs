import { SystemFunc } from "../ecs/ecs"
import { Component } from "../ecs/entity"
import { GameContext } from "./boot"

export interface Input extends Component {
    type: "input"
    actions: Map<string, string>
}

const listen: SystemFunc<GameContext> = (world) => {
    const { app } = world.context

    const inputKeys = world.useRef(new Map<string, boolean>())
    const inputCodes = world.useRef(new Map<string, boolean>())

    const entities = world.useQuery("input")

    world.useEffect(() => {
        function addKey(event: KeyboardEvent) {
            inputKeys.current.set(event.key, true)
            inputCodes.current.set(event.code, true)
        }
        function removeKey(event: KeyboardEvent) {
            inputKeys.current.set(event.key, false)
            inputCodes.current.set(event.code, false)
        }

        app.view.addEventListener("keydown", addKey)
        app.view.addEventListener("keyup", removeKey)

        return () => {
            app.view.removeEventListener("keydown", addKey)
            app.view.removeEventListener("keyup", removeKey)
        }
    }, [])

    for (const entity of entities) {
        const input = entity.components.getOne("input") as Input
        entity.removeTags(input.actions.values())
        entity.addTags(generateActions(input, inputKeys.current, inputCodes.current))
    }
}

function* generateActions(input: Input, keys: Map<string, boolean>, codes: Map<string, boolean>) {
    for (const [i, action] of input.actions.entries()) {
        if (keys.get(i) ?? false) yield action
        if (codes.get(i) ?? false) yield action
    }
}
