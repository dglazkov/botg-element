import { CSPL } from './CSPL.js';

class BotgElement extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    const style = shadow.appendChild(document.createElement('style'));
    style.textContent = `
      :host { display: flex; }
      canvas { flex: 1 }
    `;
    const canvas = shadow.appendChild(document.createElement('canvas'));
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio;
    canvas.width = Math.ceil(rect.width * dpr);
    canvas.height = Math.ceil(rect.height * dpr);
    canvas.style.cssText = `width: ${rect.width}px; height: ${rect.height}px`;
    context.scale(dpr, dpr);

    const knotXs = [ 5, 50, 100, 285 ];
    const knotYx = [ 13, 30, 90, 3 ];
    let ks = [];
    CSPL.getNaturalKs(knotXs, knotYx, ks);
    context.beginPath();
    context.moveTo(knotXs[0], knotYx[0]);
    for (let x = 1; x < 305; x+=5) {
      let y = CSPL.evalSpline(x, knotXs, knotYx, ks);
      context.strokeStyle = 'lightblue';
      context.lineWidth = 3;
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