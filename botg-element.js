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
    <g id="points">${points.map(() =>
    `<g class="point"" transform="">
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

const DATA_DELIMITER = '-';

const POINT_COUNT = 7
const POINT_OFFSET = 11
const POINT_DISTANCE = (864 / (POINT_COUNT - 1)) - 4
const POINT_SPREAD = [...Array(POINT_COUNT)].map((_, i) => i * POINT_DISTANCE + POINT_OFFSET);
const ADJUSTMENT_RANGE = [5, 495];

class Point {
  constructor(x, element, updateCallback, newValueCallback) {
    this.x = x;
    this.y = 250;
    this.element = element;
    this.transform = element.getAttributeNode('transform');
    this.adjusting = false;
    this.offset = 0;
    this.updateCallback = updateCallback;
    this.newValueCallback = newValueCallback;
    this.element.addEventListener('pointerdown', this.startAdjusting.bind(this));
    this.element.addEventListener('pointermove', this.adjust.bind(this));
    this.element.addEventListener('pointerup', this.stopAdjusting.bind(this));
  }

  update() {
    this.transform.value = `translate(${this.x}, ${this.y})`;
  }

  getPointerY(evt) {
    var ctm = this.element.ownerSVGElement.getScreenCTM();
    return (evt.clientY - ctm.f) / ctm.d;
  }

  startAdjusting(evt) {
    this.offset = this.getPointerY(evt) - this.y;
    this.element.setPointerCapture(evt.pointerId);
    this.adjusting = true;
    evt.preventDefault();
  }

  adjust(evt) {
    if (!this.adjusting) return;
    const y = this.getPointerY(evt) - this.offset;
    if (y >= ADJUSTMENT_RANGE[0] && y < ADJUSTMENT_RANGE[1]) {
      this.y = Math.round(y);
      this.updateCallback();
    }
    evt.preventDefault();
  }

  stopAdjusting(evt) {
    if (!this.adjusting) return;
    this.element.releasePointerCapture(evt.pointerId);
    this.adjusting = false;
    this.newValueCallback();
    evt.preventDefault();
  }
}

class BotgElement extends HTMLElement {
  static get observedAttributes() { return ['data']; }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = createHtml(POINT_SPREAD);
    
    const nowIndex = Math.floor(POINT_COUNT / 2);

    this.skipUpdate = false;

    this.points = [...shadow.querySelectorAll('.point')].map(
      (pointElement, i) => {
        if (i == nowIndex) pointElement.classList.add('now');
        return new Point(
          POINT_SPREAD[i],
          pointElement, 
          this.update.bind(this),
          this.writePointData.bind(this));
      });
    this.graph = new Graph(shadow.querySelector('#curve'), this.points);

    this.update();
  }

  attributeChangedCallback(name, old, value) {
    if (name != 'data') return;
    this.readPointData(value);
    this.update();
  }

  writePointData() {
    const pointData = this.points.reduce((data, point) => 
        `${data}${data.length ? DATA_DELIMITER : ''}${point.y}`, '');
    this.setAttribute('data', pointData);
    this.skipUpdate = true;
  }

  readPointData(pointData) {
    if (!pointData) return;
    const pointValues = pointData.split(DATA_DELIMITER);
    if (pointValues.length < this.points.length) return;
    this.points.forEach((point, i) => {
      const y = parseInt(pointValues[i]);
      if (isNaN(y)) return;
      point.y = y;
    });
  }

  update() {
    if (this.skipUpdate) {
      this.skipUpdate = false;
      return;
    }
    this.graph.update(this.points);
    this.points.forEach((point) => point.update());
  }
}

class Graph {
  constructor(element) {
    this.attribute = element.getAttributeNode('d');
  }

  update(points) {
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

    this.attribute.value = points.reduce((path, point, i, a) =>
      path.length ?
        `${path} ${bezierCommand(point, i, a)}` :
        `M ${point.x} ${point.y}`, '');
  }
}

customElements.define("botg-element", BotgElement);