// --- Component: The main step sequencer grid ---
export default class StepSequencer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(45px, 1fr));
                    gap: 8px;
                    align-items: end;
                }
                @media (max-width: 600px) { .grid { gap: 5px; } }
            </style>
            <div class="grid"></div>
        `;
        this._grid = this.shadowRoot.querySelector('.grid');
    }
    connectedCallback() {
        for (let i = 0; i < 16; i++) {
            const step = document.createElement('sequencer-step');
            step.dataset.index = i;
            this._grid.appendChild(step);
        }
    }
    updateStep(index, data) {
        const step = this._grid.children[index];
        if (!step) return;
        Object.keys(data).forEach(key => {
            const value = data[key];
            if (value === true) step.setAttribute(key, '');
            else if (value === false) step.removeAttribute(key);
            else step.setAttribute(key, value);
        });
    }
}
customElements.define('step-sequencer', StepSequencer);
