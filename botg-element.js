const createHtml = (points) => {
  return `
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
    <path id="curve" d="" />
    <g id="points">${points.map((point) =>
      `<circle class="point" cx="${point.x}" cy="${point.y}" r="6" />`
    )}</g>
  </svg>
`;
}

const spread = [...Array(9)].map((_, i) => i * 106 + 8);

class Point {
  constructor(x) {
    this.x = x;
    this.y = 100;
  }

  attach(element, callback) {
    new Adjustable(element, callback);
    this.element = element;
  }
}

class BotgElement extends HTMLElement {
  constructor() {
    super();

    this.points = spread.map(p => new Point(p));

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = createHtml(this.points);
    this.curvePath = shadow.querySelector('#curve').getAttributeNode('d');

    const pathBuilder = new PathBuilder(this.curvePath, this.points);
    pathBuilder.build();

    shadow.querySelectorAll('.point').forEach((point, i) => {
      this.points[i].attach(point, (y) => {
        this.points[i].y = y;
        pathBuilder.build();
      });
    });
  }
}

class PathBuilder {
  constructor(attribute, points) {
    this.attribute = attribute;
    this.points = points;
  }

  build() {
    this.attribute.value = this.points.reduce((path, point, i) => {
      if (!path) return `M ${point.x} ${point.y}`;
      return `${path} L ${point.x} ${point.y}`;
    }, '');
  }

}

class Adjustable {
  constructor(element, callback) {
    this.element = element;
    this.cy = this.element.getAttributeNode('cy');
    this.adjusting = false;
    this.offset = 0;
    this.callback = callback;
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
    const y = this.getPointerY(evt) - this.offset;
    this.cy.value = y;
    this.callback(y)
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