export default class SequencerStep extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const template = document.getElementById('sequencer-step-template');
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._slider = this.shadowRoot.querySelector('.pitch-slider');
        this._button = this.shadowRoot.querySelector('.step-button');
    }
    connectedCallback() {
        this._button.addEventListener('click', this._onClick.bind(this));
        this._slider.addEventListener('input', this._onSliderInput.bind(this));
    }
    static get observedAttributes() {
        return ['active', 'current', 'has-data', 'note', 'disabled'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'note': this._slider.value = newValue; break;
            case 'disabled': this._slider.disabled = this.hasAttribute('disabled'); break;
        }
    }
    _onClick(e) {
        this.dispatchEvent(new CustomEvent('stepclick', {
            bubbles: true, composed: true,
            detail: { shiftKey: e.shiftKey, index: parseInt(this.dataset.index, 10) }
        }));
    }
    _onSliderInput(e) {
        this.dispatchEvent(new CustomEvent('sliderinput', {
            bubbles: true, composed: true,
            detail: { note: parseInt(e.target.value, 10), index: parseInt(this.dataset.index, 10) }
        }));
    }
}
customElements.define('sequencer-step', SequencerStep);
