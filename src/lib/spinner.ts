import "spinkit/spinkit.min.css"

/*
<div class="sk-grid">
  <div class="sk-grid-cube"></div>
  <div class="sk-grid-cube"></div>
  <div class="sk-grid-cube"></div>
  <div class="sk-grid-cube"></div>
  <div class="sk-grid-cube"></div>
  <div class="sk-grid-cube"></div>
  <div class="sk-grid-cube"></div>
  <div class="sk-grid-cube"></div>
  <div class="sk-grid-cube"></div>
</div>
*/

export const grid = (containerId: string) => {
    const outerDiv = document.createElement("div")
    outerDiv.className = "sk-grid sk-center"
    for (let i = 0; i < 9; i++) {
        const innerDiv = document.createElement("div")
        innerDiv.className = "sk-grid-cube"
        outerDiv.appendChild(innerDiv)
    }
    const container = document.getElementById(containerId)
    container?.appendChild(outerDiv)
}
