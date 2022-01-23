const HTML = `
  <style>
    :host {
      display: flex;
      --gray: #78909C;
      --bordeaux: #a64d79;
    }

    svg { flex: 1 }
  
    path {
      stroke-width: 3;
      stroke: var(--gray);
    }
  
    .point {
      opacity: 0;
      fill: var(--bordeaux);
      stroke-width: 4;
      stroke: white;
    }
  
    .point:hover {
      cursor: ns-resize;
    }
  
    svg:hover .point {
      opacity: 1;
    }
  
    #axes path {
      fill: none;
    }
  
    #curve {
      fill: none;
      stroke: var(--bordeaux);
    }
  </style>
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 864 500">
    <g id="axes">
      <path d="M 3,3 L 3,497 L 857,497" />
    </g>
    <path id="now" d="M 432, 3 L 430, 497" />
    <path id="curve" d="M 1,1 L 182,250 L 364, 100 L 500, 300 L 600, 400 L 857,497" />
    <g id="points">
      <circle class="point" cx="0" cy="100" r="6" />
      <circle class="point" cx="108" cy="100" r="6" />
      <circle class="point" cx="216" cy="100" r="6" />
      <circle class="point" cx="324" cy="100" r="6" />
      <circle class="point" cx="432" cy="100" r="6" />
      <circle class="point" cx="540" cy="100" r="6" />
      <circle class="point" cx="648" cy="100" r="6" />
      <circle class="point" cx="756" cy="100" r="6" />
      <circle class="point" cx="864" cy="100" r="6" />
    </g>
  </svg>
`;

class BotgElement extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = HTML;
    this.curvePath = shadow.querySelector('#curve').getAttributeNode('d');

    shadow.querySelectorAll('.point').forEach((point) => {
      new Adjustable(point);
    });
  }
}

class Adjustable {
  constructor(element) {
    this.element = element;
    this.cy = this.element.getAttributeNode('cy');
    this.adjusting = false;
    this.offset = 0;
    this.element.addEventListener('pointerdown', this.start.bind(this));
    this.element.addEventListener('pointermove', this.adjust.bind(this));
    this.element.addEventListener('pointerup', this.stop.bind(this));
  }

  getPointerY(evt) {
    var ctm = this.element.ownerSVGElement.getScreenCTM();
    return (evt.clientY - ctm.f) / ctm.d;
  }

  start(evt) {
    this.offset = this.getPointerY(evt) - parseFloat(this.cy.value);
    this.element.setPointerCapture(evt.pointerId);
    this.adjusting = true;
    evt.preventDefault();
  }

  adjust(evt) {
    if (!this.adjusting) return;
    let y = this.getPointerY(evt);
    this.cy.value = y - this.offset;
    evt.preventDefault();
  }

  stop(evt) {
    if (!this.adjusting) return;
    this.element.releasePointerCapture(evt.pointerId);
    this.adjusting = false;
    evt.preventDefault();
  }
}


customElements.define("botg-element", BotgElement);