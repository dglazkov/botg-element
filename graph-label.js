const createHtml = () => {
  return `
    <style>
      :host {
        box-sizing: border-box;
        display: inline-block;  
      }

      input, #backing {
        border: 0;
        font-family: var(--label-font);
        font-size: var(--label-size);
        padding: 0 6px;
        box-sizing: border-box;
        position: absolute;
      }

      input {
        position: absolute;
        opacity: 0;
        transition: transform 0.2s, opacity 0.2s;
        transform-origin: 2% 100%;
        cursor: pointer;
      }

      input:focus-visible {
        opacity: 1;
        cursor: text;
      }

      #backing {
        white-space: nowrap;
        background: white;
        color: var(--label-color);
        min-width: 40px;
        cursor: default;
      }
    </style>
    <div id="label">
      <div id="backing"></div>
      <input type="text">
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