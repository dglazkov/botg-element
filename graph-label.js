const createHtml = () => {
  return `
    <style>
      :host {
        box-sizing: border-box;
        display: inline-block;  
      }

      input, #backing {
        border: 0;
        font-family: 'Amatic SC';
        font-size: 30px;
        padding: 0 6px;
        box-sizing: border-box;
        position: absolute;
      }

      input {
        position: absolute;
        opacity: 0;
        transition: transform 0.2s, opacity 0.2s;
        transform-origin: 10px;
      }

      input:focus-visible {
        opacity: 1;
      }

      #backing {
        white-space: nowrap;
        background: white;
        min-width: 40px;
      }
    </style>
    <div id="label">
      <div id="backing">title goes here</div>
      <input type="text" value="title goes here">
    </div>
  `
}

const createTransformCss = (rotate) => {
  let deg = parseInt(rotate);
  if (isNaN(deg) || deg < 0 || deg > 90) {
    deg = 0;
  }
  return `
    input:focus-visible {
      transform: rotate(${deg}deg);

    }

    #label {
      transform: rotate(-${deg}deg);
    }
    `;
}

class GraphLabel extends HTMLElement {
  static get observedAttributes() { return ['title', 'rotate']; }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = createHtml();

    this.transformStyle = shadow.appendChild(document.createElement('style'));

    this.text = shadow.querySelector('#backing');
    this.input = shadow.querySelector('input');
    this.addEventListener('input', () => {
      this.text.textContent = this.input.value;
    });
  }

  updateRotation(rotate) {
    this.transformStyle.textContent = createTransformCss(rotate);
  }

  updateTitle(title) {
    this.text.textContent = title;
    this.input.value = title;
  }

  attributeChangedCallback(name, old, value) {
    switch (name) {
      case 'rotate':
        this.updateRotation(value);
        break;
      case 'title':
        this.updateTitle(value);
        break;
    }
  }
}

customElements.define("graph-label", GraphLabel);