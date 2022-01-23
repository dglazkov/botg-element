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

const POINT_COUNT = 7
const POINT_OFFSET = 12
const POINT_DISTANCE = (864 / (POINT_COUNT - 1)) - 4
const POINT_SPREAD = [...Array(POINT_COUNT)].map((_, i) => i * POINT_DISTANCE + POINT_OFFSET);

class Point {
  constructor(x) {
    this.x = x;
    this.y = 250;
  }

  attach(element, callback) {
    new Adjustable(element, callback);
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
    // adapted from https://francoisromain.medium.com/smooth-a-svg-path-with-cubic-bezier-curves-e37b49d46c74
    const controlPoint = (current, previous, next, reverse) => {
      const p = previous || current
      const n = next || current
      // The smoothing ratio
      const smoothing = 0.2
      // Properties of the opposed-line
      const lengthX = n.x - p.x;
      const lengthY = n.y - p.y;
      const lineLength = Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2))
      const lineAngle = Math.atan2(lengthY, lengthX)
      // If is end-control-point, add PI to the angle to go backward
      const angle = lineAngle + (reverse ? Math.PI : 0)
      const length = lineLength * smoothing
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