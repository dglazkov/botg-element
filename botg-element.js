const createHtml = (points) => {
  return `
  <style>
    
    :host {
      display: flex;
      --gray: #78909C;
      --lightgray: #98A0AC;
      --bordeaux: #a64d79;
    }

    svg { flex: 1 }
  
    path {
      stroke-width: 3;
      stroke: var(--gray);
    }
  
    .point circle {
      opacity: 0;
      fill: var(--bordeaux);
      stroke-width: 4;
      stroke: white;
    }

    .now .visible {
      opacity: 1;
    }
  
    .point:hover {
      cursor: ns-resize;
    }

    .point path {
      stroke: none;
    }

    .point:hover .backing {
      stroke: white;
      fill: white;
      opacity: 1;
    }

    rect.backing {
      fill: white;
    }

    .point:hover .marker {
      stroke: var(--lightgray);
    }
  
    svg:hover .point circle.visible {
      opacity: 1;
    }
  
    #axes path {
      fill: none;
    }

    #now {
      stroke-dasharray: 10;
    }
  
    #curve {
      fill: none;
      stroke: var(--bordeaux);
    }

    text.label {
      font-family: 'Amatic SC';
      font-size: 30px;
      fill: var(--gray);
    }
  </style>
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 864 500">
    <g id="axes">
      <path d="M 3,3 L 3,497 L 857,497" />
    </g>
    <path id="now" d="M 432, 3 L 430, 497" />
    <path id="curve" d="" />
    <g id="points">${points.map((point) =>
      `<g class="point" transform="translate(${point.x}, ${point.y})">
          <g class="hint">
            <path class="backing" d="M 0, -30 L 0, 30" />
            <path class="marker" d="M 0, -20 L 0, 20" />
          </g>
          <circle class="visible" cx="0" cy="0" r="6" />
          <circle class="hit-area" cx="0" cy="0" r="30" />
      </g>`
    )}</g>
    <g id="labels">
      <rect class="backing" x="790" y="444" width="58" height="48" />
      <text class="label" x="800" y="480">TIME</text>
    </g>
  </svg>
`;
}

const POINT_COUNT = 7
const POINT_OFFSET = 11
const POINT_DISTANCE = (864 / (POINT_COUNT - 1)) - 4
const POINT_SPREAD = [...Array(POINT_COUNT)].map((_, i) => i * POINT_DISTANCE + POINT_OFFSET);
const ADJUSTMENT_RANGE = [5, 495]; 

class Point {
  constructor(x) {
    this.x = x;
    this.y = 250;
  }

  attach(element, callback) {
    new Adjustable(element, this, callback);
    this.element = element;
  }
}

class BotgElement extends HTMLElement {
  constructor() {
    super();

    this.points = POINT_SPREAD.map(p => new Point(p));



    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = createHtml(this.points);
    this.curvePath = shadow.querySelector('#curve').getAttributeNode('d');

    const pathBuilder = new PathBuilder(this.curvePath, this.points);
    pathBuilder.build();

    const nowIndex = Math.floor(POINT_COUNT / 2);
    shadow.querySelectorAll('.point').forEach((point, i) => {
      if (i == nowIndex) point.classList.add('now');
      this.points[i].attach(point, this.update.bind(this));
    });
  }

  connectedCallback() {
    this.readPointData(this.getAttribute('data'));
    this.update();
  }

  attributeChangedCallback(name, old, value) {
    if (name != 'data') return;
    this.readPointData(value);
    this.update();
  }

  readPointData(pointData) {
    if (!pointData) return;
    const pointValues = pointData.split(',');
    if (pointValues.length < this.points.length) return;
    this.points.forEach((point, i) => {
      const y = parseInt(pointValues[i]);
      if (isNaN(y)) return;
      point.y = y;
    });
  }

  update() {
    const pathBuilder = new PathBuilder(this.curvePath, this.points);
    pathBuilder.build();
    this.points.forEach((point, i) => {
      point.element.setAttribute('transform', 
        `translate(${point.x}, ${point.y})`);
    });
  }
}

class PathBuilder {
  constructor(attribute, points) {
    this.attribute = attribute;
    this.points = points;
  }

  build() {
    // adapted from https://francoisromain.medium.com/smooth-a-svg-path-with-cubic-bezier-curves-e37b49d46c74
    const controlPoint = (current, previous, next, reverse) => {
      const p = previous || current
      const n = next || current
      // The smoothing ratio
      const smoothing = 0.15
      // Properties of the opposed-line
      const lengthX = n.x - p.x;
      const lengthY = n.y - p.y;
      // If is end-control-point, add PI to the angle to go backward
      const angle = Math.atan2(lengthY, lengthX) + (reverse ? Math.PI : 0)
      const length = 
        Math.sqrt(Math.pow(lengthX, 2) + 
        Math.pow(lengthY, 2)) * smoothing
      // The control point position is relative to the current point
      const x = current.x + Math.cos(angle) * length
      const y = current.y + Math.sin(angle) * length
      return [x, y]
    }

    const bezierCommand = (point, i, a) => {
      // start control point
      const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point)
      // end control point
      const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true)
      return `C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point.x},${point.y}`
    }

    this.attribute.value = this.points.reduce((path, point, i, a) => 
      path.length ? 
        `${path} ${bezierCommand(point, i, a)}` : 
        `M ${point.x} ${point.y}`, '');
  }
}

class Adjustable {
  constructor(element, point, callback) {
    this.element = element;
    this.point = point;
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
    this.offset = this.getPointerY(evt) - this.point.y;
    this.element.setPointerCapture(evt.pointerId);
    this.adjusting = true;
    evt.preventDefault();
  }

  adjust(evt) {
    if (!this.adjusting) return;
    const y = this.getPointerY(evt) - this.offset;
    if (y >= ADJUSTMENT_RANGE[0] && y < ADJUSTMENT_RANGE[1]) {
      this.point.y = y;
      this.callback();
    }
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