let active = null;
export function signal(initial) {
    let value = initial;
    const subs = new Set();
    const get = (() => {
        if (active && !subs.has(active)) {
            const effectRun = active;
            subs.add(effectRun);
            effectRun.deps.push(() => subs.delete(effectRun));
        }
        return value;
    });
    get.set = (next) => {
        const resolved = typeof next === "function" ? next(value) : next;
        if (Object.is(resolved, value))
            return;
        value = resolved;
        for (const effectRun of [...subs])
            effectRun.run();
    };
    get.peek = () => value;
    return get;
}
export function effect(fn) {
    const subscriber = {
        deps: [],
        run() {
            for (const unsubscribe of this.deps)
                unsubscribe();
            this.deps = [];
            const previous = active;
            active = this;
            try {
                fn();
            }
            finally {
                active = previous;
            }
        },
    };
    subscriber.run();
    return () => {
        for (const unsubscribe of subscriber.deps)
            unsubscribe();
        subscriber.deps = [];
    };
}
export function computed(fn) {
    const mirror = signal(undefined);
    effect(() => {
        mirror.set(fn());
    });
    return mirror;
}
export function flattenChildren(children) {
    const flat = [];
    const visit = (child) => {
        if (child == null || child === false)
            return;
        if (Array.isArray(child)) {
            for (const item of child)
                visit(item);
            return;
        }
        flat.push(child);
    };
    for (const child of children)
        visit(child);
    return flat;
}
export function h(tag, props, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props ?? {})) {
        if (key === "class")
            el.className = String(value ?? "");
        else if (key.startsWith("on") && typeof value === "function") {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        }
        else if (typeof value === "function") {
            effect(() => {
                const next = value();
                el.setAttribute(key, String(next ?? ""));
            });
        }
        else if (value != null && value !== false) {
            el.setAttribute(key, String(value));
        }
    }
    for (const child of flattenChildren(children)) {
        if (typeof child === "function") {
            const text = document.createTextNode("");
            el.appendChild(text);
            effect(() => {
                text.nodeValue = String(child() ?? "");
            });
        }
        else if (child instanceof Node)
            el.appendChild(child);
        else
            el.appendChild(document.createTextNode(String(child)));
    }
    return el;
}
export function hueToRgb(hue) {
    const turn = ((hue % 360) + 360) % 360;
    const channel = 1 - Math.abs(((turn / 60) % 2) - 1);
    if (turn < 60)
        return [1, channel, 0];
    if (turn < 120)
        return [channel, 1, 0];
    if (turn < 180)
        return [0, 1, channel];
    if (turn < 240)
        return [0, channel, 1];
    if (turn < 300)
        return [channel, 0, 1];
    return [1, 0, channel];
}
export function mountFill(canvas, color) {
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl)
        return () => { };
    const shader = (type, source) => {
        const compiled = gl.createShader(type);
        if (!compiled)
            throw new Error("shader");
        gl.shaderSource(compiled, source);
        gl.compileShader(compiled);
        return compiled;
    };
    const program = gl.createProgram();
    if (!program)
        return () => { };
    gl.attachShader(program, shader(gl.VERTEX_SHADER, "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }"));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, "precision mediump float; uniform vec3 u; void main(){ gl_FragColor = vec4(u, 1.0); }"));
    gl.linkProgram(program);
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    const uniform = gl.getUniformLocation(program, "u");
    const stop = effect(() => {
        const [r, g, b] = color();
        const width = canvas.clientWidth || 1;
        const height = canvas.clientHeight || 1;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform3f(uniform, r, g, b);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
    return stop;
}
