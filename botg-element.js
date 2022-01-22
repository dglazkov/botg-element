const html = `
  <style>
    :host { display: flex; }
    svg { flex: 1 }
  </style>
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 162 100">
    <path id="curve" d="" stroke="blue" fill="none"></path>
  </svg>
`;

class BotgElement extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = html;
    this.curvePath = shadow.querySelector('#curve').getAttributeNode('d');

    setTimeout(() => {
      this.curvePath.value = 'M 0,0 L 15,25 L 162,100';
    }, 1000);
  }
}

customElements.define("botg-element", BotgElement);