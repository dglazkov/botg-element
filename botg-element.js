import { CSPL } from './CSPL.js';

class SVGBotgElement extends HTMLElement {

}

class BotgElement extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    const style = shadow.appendChild(document.createElement('style'));

    const knotXs = [ 5, 50, 100, 285 ];
    const knotYx = [ 13, 30, 90, 3 ];

    style.textContent = `
      :host { display: flex; }
    `;

    const svg = shadow.appendChild(document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    ));
    svg.setAttribute('version', '1.1');
    svg.setAttribute('viewBox', '0 0 100 100');

    const path = svg.appendChild(document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    ));
    path.setAttribute('d', 'M 10,20 L 15,25 L 20,35');
    path.setAttribute('stroke', 'blue');
    path.setAttribute('fill', 'none');

    setTimeout(() => {
      path.setAttribute('d', 'M 10,40 L 15,25 L 20,35');
    }, 1000);
  }
}

customElements.define("botg-element", BotgElement);