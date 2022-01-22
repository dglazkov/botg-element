class BotgElement extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(document.createElement('div')).innerText = 'graph goes here';
  }
}

customElements.define("botg-element", BotgElement);