import { grid } from "./lib/spinner"
//import 'html5-history-api'
//import 'promise-polyfill/src/polyfill'

grid("spinner")
initialize()

async function initialize() {
    const { bootstrap } = await import("./game/boot")

    const spinner = document.getElementById("spinner")
    if (spinner) {
        spinner.style.display = "none"
    }

    bootstrap()
}
