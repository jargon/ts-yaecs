//import 'html5-history-api'
import * as PIXI from 'pixi.js'
//import 'promise-polyfill/src/polyfill'
import './game/assets/ship.png'

const app = new PIXI.Application()
document.getElementById("container")?.appendChild(app.view)

