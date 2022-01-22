import { CSPL } from './CSPL.js';

class BotgElement extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    const text = shadow.appendChild(document.createElement('div'));
    const knotXs = [ 0, 5, 10, 15 ];
    const knotYx = [ 10, 0, 5, 0 ];
    let ks = [];
    CSPL.getNaturalKs(knotXs, knotYx, ks);
    let x = 0;
    let y = CSPL.evalSpline(x, knotXs, knotYx, ks);
    text.innerText = `${y}`;
  }
}

customElements.define("botg-element", BotgElement);