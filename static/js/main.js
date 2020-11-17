const {
    Component,
    Record,
} = window.Torus;

const Gram = Record;

const debounce = (fn, delayMillis) => {
    let lastRun = 0;
    let to = null;
    return (...args) => {
        clearTimeout(to);
        const now = Date.now();
        const dfn = () => {
            lastRun = now;
            fn(...args);
        }
        if (now - lastRun > delayMillis) {
            dfn()
        } else {
            to = setTimeout(dfn, delayMillis);
        }
    }
}

class Typogram extends Component {
    init(gram) {
        this.bind(gram, data => this.render(data));

        this.scale = 1;
        this.setScale();

        window.addEventListener('resize', debounce(this.setScale.bind(this), 300));
    }
    setScale() {
        const maxTypogramWidth = window.innerWidth - 2 * 16;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!this.node) {
                    this.setScale();
                    return;
                }

                const { width } = getComputedStyle(this.node);
                this.scale = maxTypogramWidth / parseFloat(width);
                this.render();
            });
        });
    }
    compose(gram) {
        const {
            header, footer, body,
            fontFamily, textAlign, colorScheme, fontSize,
        } = gram;

        const {innerWidth} = window;
        const maxScale = innerWidth <= 930 ? .8 : 1;
        const scale = Math.min(this.scale, maxScale);

        return jdom`<div class="paper typogram
            font-${fontFamily}
            align-${textAlign}
            scheme-${colorScheme}
            size-${fontSize}"
            style="transform: ${innerWidth <= 930 ? `translateX(-50%) scale(${scale})` : null};
                margin: ${scale < 0.8 ? `${(scale - 1) * 50}% 0` : null}">
            <div class="typogram-header">${header}</div>
            <div class="typogram-body">${body}</div>
            <div class="typogram-footer">${footer}</div>
        </div>`;
    }
}

class Editor extends Component {
    init(gram, { downloader }) {
        this.downloader = downloader;

        this.bind(gram, data => this.render(data));

        this.updateModel = this.updateModel.bind(this);
    }
    updateModel(prop, value) {
        this.record.update({[prop]: value});
    }
    compose(gram) {
        return jdom`<div class="paper paper-border-top editor">
            <header>
                <h1>Typogram</h1>
                <nav>
                    <a href="https://github.com/thesephist/typogram"
                        target="_blank">About Typogram</a>
                </nav>
            </header>

            <details open>
                <summary>
                    <h2>1. The message</h2>
                </summary>
                <label>
                    <p>Header</p>
                    <input type="text" placeholder="Title or subject"
                        class="paper"
                        value=${gram.header}
                        oninput=${evt => this.updateModel('header', evt.target.value)} />
                </label>
                <label>
                    <p>Body</p>
                    <div class="textarea-wrapper">
                        <div class="paper p-height
                            ${gram.bodyRaw.endsWith('\n') ? 'pad-end' : ''}"
                            aria-hidden>${gram.bodyRaw}</div>
                        <textarea placeholder="Start writing..."
                            class="paper"
                            value=${gram.bodyRaw}
                            oninput=${evt => {
                                this.updateModel('bodyRaw', evt.target.value);
                                this.updateModel('body', Markus(evt.target.value));
                            }} />
                    </div>
                </label>
                <label>
                    <p>Footer</p>
                    <input type="text" placeholder="Source, link, or author"
                        class="paper"
                        value=${gram.footer}
                        oninput=${evt => this.updateModel('footer', evt.target.value)} />
                </label>
            </details>

            <details open>
                <summary>
                    <h2>2. The look</h2>
                </summary>
                <label class="row">
                    <p>Alignment</p>
                    <select class="movable paper"
                        onchange=${evt => this.updateModel('textAlign', evt.target.value)}>
                        <option value="left">left</option>
                        <option value="center">center</option>
                        <option value="right">right</option>
                    </select>
                </label>
                <label class="row">
                    <p>Typography</p>
                    <select class="movable paper"
                        onchange=${evt => this.updateModel('fontFamily', evt.target.value)}>
                        <option value="serif">serif</option>
                        <option value="sans">sans-serif</option>
                        <option value="mono">monospace</option>
                    </select>
                </label>
                <label class="row">
                    <p>Text size</p>
                    <select class="movable paper"
                        onchange=${evt => this.updateModel('fontSize', evt.target.value)}>
                        <option value="small">small</option>
                        <option value="medium">medium</option>
                        <option value="large">large</option>
                    </select>
                </label>
                <label class="row">
                    <p>Color</p>
                    <select class="movable paper"
                        onchange=${evt => this.updateModel('colorScheme', evt.target.value)}>
                        <option value="light">light</option>
                        <option value="dark">dark</option>
                    </select>
                </label>
            </details>

            <details open>
                <summary>
                    <h2>3. Download</h2>
                </summary>
                <button class="accent movable paper"
                    onclick=${this.downloader}
                    >Download (.png)</button>
            </details>

            <div class="credits">
                A project by
                <a href="https://thesephist.com" target="_blank">@thesephist</a>.,
                made with
                <a href="https://github.com/thesephist/torus" target="_blank">Torus</a>
                and
                <a href="https://thesephist.github.io/paper.css/" target="_blank">paper.css</a>.
            </div>
        </div>`;
    }
}

class App extends Component {
    init() {
        this.gram = new Gram({
            fontFamily: 'serif',
            textAlign: 'left',
            colorScheme: 'light',
            fontSize: 'small',

            header: 'Typogram',
            footer: 'typogram.app',
            bodyRaw: `Start writing...`,
            body: Markus('Start writing...'),
        });

        this.preview = new Typogram(this.gram);
        this.editor = new Editor(this.gram, {
            downloader: () => {
                const staticPreview = new Typogram(this.gram);
                staticPreview.node.style.position = 'absolute';
                staticPreview.node.style.top = '-100000px';
                staticPreview.node.style.left = '-100000px';
                staticPreview.node.style.transform = 'none';
                document.body.appendChild(staticPreview.node);

                html2canvas(staticPreview.node, {
                    scrollY: -window.scrollY,
                }).then(canvas => {
                    const pngURL = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = pngURL;
                    a.setAttribute('download', `${this.gram.get('header').replace(/\W/g, '-')}.png`);
                    a.click();

                    document.body.removeChild(staticPreview.node);
                });
            },
        });
    }
    compose() {
        return jdom`<div class="app">
            ${this.preview.node}
            ${this.editor.node}
        </div>`;
    }
}

const app = new App();
document.body.appendChild(app.node);

