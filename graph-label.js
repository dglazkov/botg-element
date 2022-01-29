const createHtml = () => {
  return `
    <style>
      :host {
        box-sizing: border-box;
      }
      input, #backing {
        transform: rotate(-14deg);
        border: 0;
        font-family: 'Amatic SC';
        font-size: 30px;
        padding: 2px 5px;
      }

      input {
        box-sizing: border-box;
        position: absolute;
        background: transparent;
        transition: transform 0.2s;
      }

      input:focus-visible {
        transform: rotate(0);
        background: white;
      }

      #backing {
        position: absolute;
        background: white;
        color: white;
      }

      #label {
      }
    </style>
    <div id="label">
      <div id="backing">title goes here</div>
      <input type="text" value="title goes here">
    </div>
  `
}

class GraphLabel extends HTMLElement {
    static get observedAttributes() { return ['title']; }
  
    constructor() {
      super();

      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = createHtml();

      this.backing = shadow.querySelector('#backing');
      this.input = shadow.querySelector('input');
      this.input.addEventListener('input', () => {
        this.adjustSize(this.input.value);
      });
    
      this.adjustSize(this.input.value);
    }

    adjustSize(value) {
      this.backing.textContent = value;
      const rect = this.backing.getBoundingClientRect();
      const width = rect.width < 50 ? 50 : rect.width - 4;
      this.input.style.width = `${rect.width - 4}px`;
    }

    attributeChangedCallback(name, old, value) {
    }
}

customElements.define("graph-label", GraphLabel);