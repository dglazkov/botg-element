import { CSPL } from './CSPL.js';

class BotgElement extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    const canvas = shadow.appendChild(document.createElement('canvas'));
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio;
    canvas.width = Math.ceil(rect.width * dpr);
    canvas.height = Math.ceil(rect.height * dpr);
    canvas.style.cssText = `width: ${rect.width}px; height: ${rect.height}px`;
    context.scale(dpr, dpr);

    const knotXs = [ 3, 50, 100, 150 ];
    const knotYx = [ 100, 3, 50, 3 ];
    let ks = [];
    CSPL.getNaturalKs(knotXs, knotYx, ks);
    context.beginPath();
    context.moveTo(knotXs[0], knotYx[0]);
    for (let x = 1; x < 150; x+=1) {
      let y = CSPL.evalSpline(x, knotXs, knotYx, ks);
      context.strokeStyle = 'lightblue';
      context.lineWidth = 2;
      context.lineTo(x, y);
    }
    context.stroke();
    for (let i = 0; i < 5; ++i) {
      context.beginPath();
      context.lineWidth = 1;
      context.strokeStyle = 'rgb(33,33,33)';
      context.moveTo(knotXs[i], knotYx[i] - 5);
      context.lineTo(knotXs[i], knotYx[i] + 5);
      context.moveTo(knotXs[i] - 5, knotYx[i]);
      context.lineTo(knotXs[i] + 5, knotYx[i]);
      context.stroke();
    }
  }
}

customElements.define("botg-element", BotgElement);