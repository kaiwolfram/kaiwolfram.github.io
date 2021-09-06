
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init$1(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function createStrings(width, height) {
        const strings = {
            color: 'black',
            size: 3,
            len: 0.948 * width,
            x1: 0.05 * width,
            y: [
                0.1 * height,
                (0.1 + 8 / 30) * height,
                (0.1 + (2 * 8) / 30) * height,
                0.9 * height,
            ],
        };
        return strings;
    }
    function createFrets(ukeStrings, fretCount) {
        var posX = [];
        for (var i = 0; i <= fretCount; i++) {
            posX.push(ukeStrings.x1 + (i / fretCount) * ukeStrings.len);
        }
        const frets = {
            color: "grey",
            size: 2,
            x: posX,
            y1: ukeStrings.y[0],
            y2: ukeStrings.y.slice(-1)[0],
        };
        return frets;
    }
    function createNut(frets) {
        const nut = {
            color: "black",
            size: 4 * frets.size,
            x: frets.x[0],
            y1: frets.y1,
            y2: frets.y2,
        };
        return nut;
    }
    function createMarks(frets, r) {
        const fretStep = (frets.x.slice(-1)[0] - frets.x[0]) / (frets.x.length - 1);
        var marks = [];
        for (var i = 0; i <= frets.x.length; i++) {
            if ([3, 5, 7, 10, 12, 15].includes(i)) {
                const height = (frets.y2 + frets.y1) / 2;
                const x = { x: frets.x[0] + (i - 0.5) * fretStep, y: height, r: r };
                marks.push(x);
            }
        }
        return marks;
    }
    function createChords(ukeStrings, frets, chords, r) {
        let colors = ["lightgreen", "skyblue", "coral", "gold", "mediumpurple", "pink"];
        var notes = [];
        for (var i = 0; i < chords.length; i++) {
            notes.push(createChord(ukeStrings, frets, chords[i], r, colors[i]));
        }
        return notes.flat();
    }
    function createChord(ukeStrings, frets, chord, r, color) {
        // 4 Strings make 3 sections
        const stringStep = (ukeStrings.y.slice(-1)[0] - ukeStrings.y[0]) / (ukeStrings.y.length - 1);
        const fretStep = (frets.x.slice(-1)[0] - frets.x[0]) / (frets.x.length - 1);
        var notes = [];
        for (var i = 0; i < chord.length; i++) {
            const note = {
                color: color,
                fret: (chord[i] - 0.5) * fretStep + frets.x[0],
                stringo: (chord.length - 1 - i) * stringStep + ukeStrings.y[0],
                r: r,
            };
            notes.push(note);
        }
        return notes;
    }
    function arrayToChords(array) {
        var chords = [];
        for (var i = 0; i < array.length / 4; i++) {
            chords.push(Array.from(array.subarray(4 * i, 4 * i + 4)));
        }
        return chords;
    }

    /* src\components\Uke.svelte generated by Svelte v3.42.4 */

    const file$4 = "src\\components\\Uke.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i].x;
    	child_ctx[14] = list[i].y;
    	child_ctx[15] = list[i].r;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (18:8) {#each frets.x as x}
    function create_each_block_3(ctx) {
    	let line;
    	let line_x__value;
    	let line_y__value;
    	let line_x__value_1;
    	let line_y__value_1;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "x1", line_x__value = /*x*/ ctx[13]);
    			attr_dev(line, "y1", line_y__value = /*frets*/ ctx[2].y1);
    			attr_dev(line, "x2", line_x__value_1 = /*x*/ ctx[13]);
    			attr_dev(line, "y2", line_y__value_1 = /*frets*/ ctx[2].y2);
    			set_style(line, "stroke", /*frets*/ ctx[2].color);
    			set_style(line, "stroke-width", /*frets*/ ctx[2].size);
    			add_location(line, file$4, 18, 12, 594);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*frets*/ 4 && line_x__value !== (line_x__value = /*x*/ ctx[13])) {
    				attr_dev(line, "x1", line_x__value);
    			}

    			if (dirty & /*frets*/ 4 && line_y__value !== (line_y__value = /*frets*/ ctx[2].y1)) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*frets*/ 4 && line_x__value_1 !== (line_x__value_1 = /*x*/ ctx[13])) {
    				attr_dev(line, "x2", line_x__value_1);
    			}

    			if (dirty & /*frets*/ 4 && line_y__value_1 !== (line_y__value_1 = /*frets*/ ctx[2].y2)) {
    				attr_dev(line, "y2", line_y__value_1);
    			}

    			if (dirty & /*frets*/ 4) {
    				set_style(line, "stroke", /*frets*/ ctx[2].color);
    			}

    			if (dirty & /*frets*/ 4) {
    				set_style(line, "stroke-width", /*frets*/ ctx[2].size);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(18:8) {#each frets.x as x}",
    		ctx
    	});

    	return block;
    }

    // (38:8) {#each strings.y as y}
    function create_each_block_2(ctx) {
    	let line;
    	let line_x__value;
    	let line_y__value;
    	let line_x__value_1;
    	let line_y__value_1;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "x1", line_x__value = /*strings*/ ctx[3].x1);
    			attr_dev(line, "y1", line_y__value = /*y*/ ctx[14]);
    			attr_dev(line, "x2", line_x__value_1 = /*strings*/ ctx[3].x1 + /*strings*/ ctx[3].len);
    			attr_dev(line, "y2", line_y__value_1 = /*y*/ ctx[14]);
    			set_style(line, "stroke", /*strings*/ ctx[3].color);
    			set_style(line, "stroke-width", /*strings*/ ctx[3].size);
    			add_location(line, file$4, 38, 12, 1107);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*strings*/ 8 && line_x__value !== (line_x__value = /*strings*/ ctx[3].x1)) {
    				attr_dev(line, "x1", line_x__value);
    			}

    			if (dirty & /*strings*/ 8 && line_y__value !== (line_y__value = /*y*/ ctx[14])) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*strings*/ 8 && line_x__value_1 !== (line_x__value_1 = /*strings*/ ctx[3].x1 + /*strings*/ ctx[3].len)) {
    				attr_dev(line, "x2", line_x__value_1);
    			}

    			if (dirty & /*strings*/ 8 && line_y__value_1 !== (line_y__value_1 = /*y*/ ctx[14])) {
    				attr_dev(line, "y2", line_y__value_1);
    			}

    			if (dirty & /*strings*/ 8) {
    				set_style(line, "stroke", /*strings*/ ctx[3].color);
    			}

    			if (dirty & /*strings*/ 8) {
    				set_style(line, "stroke-width", /*strings*/ ctx[3].size);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(38:8) {#each strings.y as y}",
    		ctx
    	});

    	return block;
    }

    // (49:8) {#each marks as { x, y, r }}
    function create_each_block_1$1(ctx) {
    	let circle;
    	let circle_cx_value;
    	let circle_cy_value;
    	let circle_r_value;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", circle_cx_value = /*x*/ ctx[13]);
    			attr_dev(circle, "cy", circle_cy_value = /*y*/ ctx[14]);
    			attr_dev(circle, "r", circle_r_value = /*r*/ ctx[15]);
    			attr_dev(circle, "fill", "lightgrey");
    			add_location(circle, file$4, 49, 12, 1433);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*marks*/ 32 && circle_cx_value !== (circle_cx_value = /*x*/ ctx[13])) {
    				attr_dev(circle, "cx", circle_cx_value);
    			}

    			if (dirty & /*marks*/ 32 && circle_cy_value !== (circle_cy_value = /*y*/ ctx[14])) {
    				attr_dev(circle, "cy", circle_cy_value);
    			}

    			if (dirty & /*marks*/ 32 && circle_r_value !== (circle_r_value = /*r*/ ctx[15])) {
    				attr_dev(circle, "r", circle_r_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(49:8) {#each marks as { x, y, r }}",
    		ctx
    	});

    	return block;
    }

    // (54:8) {#each notes as note}
    function create_each_block$1(ctx) {
    	let circle;
    	let circle_cx_value;
    	let circle_cy_value;
    	let circle_r_value;
    	let circle_fill_value;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", circle_cx_value = /*note*/ ctx[10].fret);
    			attr_dev(circle, "cy", circle_cy_value = /*note*/ ctx[10].stringo);
    			attr_dev(circle, "r", circle_r_value = /*note*/ ctx[10].r);
    			attr_dev(circle, "fill", circle_fill_value = /*note*/ ctx[10].color);
    			add_location(circle, file$4, 54, 12, 1567);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*notes*/ 16 && circle_cx_value !== (circle_cx_value = /*note*/ ctx[10].fret)) {
    				attr_dev(circle, "cx", circle_cx_value);
    			}

    			if (dirty & /*notes*/ 16 && circle_cy_value !== (circle_cy_value = /*note*/ ctx[10].stringo)) {
    				attr_dev(circle, "cy", circle_cy_value);
    			}

    			if (dirty & /*notes*/ 16 && circle_r_value !== (circle_r_value = /*note*/ ctx[10].r)) {
    				attr_dev(circle, "r", circle_r_value);
    			}

    			if (dirty & /*notes*/ 16 && circle_fill_value !== (circle_fill_value = /*note*/ ctx[10].color)) {
    				attr_dev(circle, "fill", circle_fill_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(54:8) {#each notes as note}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let svg;
    	let line;
    	let line_x__value;
    	let line_y__value;
    	let line_x__value_1;
    	let line_y__value_1;
    	let each1_anchor;
    	let each2_anchor;
    	let each_value_3 = /*frets*/ ctx[2].x;
    	validate_each_argument(each_value_3);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*strings*/ ctx[3].y;
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*marks*/ ctx[5];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*notes*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			line = svg_element("line");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			each1_anchor = empty();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			each2_anchor = empty();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(line, "x1", line_x__value = /*nut*/ ctx[6].x);
    			attr_dev(line, "y1", line_y__value = /*nut*/ ctx[6].y1);
    			attr_dev(line, "x2", line_x__value_1 = /*nut*/ ctx[6].x);
    			attr_dev(line, "y2", line_y__value_1 = /*nut*/ ctx[6].y2);
    			set_style(line, "stroke", /*nut*/ ctx[6].color);
    			set_style(line, "stroke-width", /*nut*/ ctx[6].size);
    			add_location(line, file$4, 28, 8, 848);
    			attr_dev(svg, "height", /*height*/ ctx[1]);
    			attr_dev(svg, "width", /*width*/ ctx[0]);
    			add_location(svg, file$4, 15, 4, 504);
    			add_location(div, file$4, 14, 0, 493);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(svg, null);
    			}

    			append_dev(svg, line);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(svg, null);
    			}

    			append_dev(svg, each1_anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(svg, null);
    			}

    			append_dev(svg, each2_anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svg, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*frets*/ 4) {
    				each_value_3 = /*frets*/ ctx[2].x;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_3(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(svg, line);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_3.length;
    			}

    			if (dirty & /*nut*/ 64 && line_x__value !== (line_x__value = /*nut*/ ctx[6].x)) {
    				attr_dev(line, "x1", line_x__value);
    			}

    			if (dirty & /*nut*/ 64 && line_y__value !== (line_y__value = /*nut*/ ctx[6].y1)) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*nut*/ 64 && line_x__value_1 !== (line_x__value_1 = /*nut*/ ctx[6].x)) {
    				attr_dev(line, "x2", line_x__value_1);
    			}

    			if (dirty & /*nut*/ 64 && line_y__value_1 !== (line_y__value_1 = /*nut*/ ctx[6].y2)) {
    				attr_dev(line, "y2", line_y__value_1);
    			}

    			if (dirty & /*nut*/ 64) {
    				set_style(line, "stroke", /*nut*/ ctx[6].color);
    			}

    			if (dirty & /*nut*/ 64) {
    				set_style(line, "stroke-width", /*nut*/ ctx[6].size);
    			}

    			if (dirty & /*strings*/ 8) {
    				each_value_2 = /*strings*/ ctx[3].y;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(svg, each1_anchor);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty & /*marks*/ 32) {
    				each_value_1 = /*marks*/ ctx[5];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(svg, each2_anchor);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*notes*/ 16) {
    				each_value = /*notes*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(svg, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*height*/ 2) {
    				attr_dev(svg, "height", /*height*/ ctx[1]);
    			}

    			if (dirty & /*width*/ 1) {
    				attr_dev(svg, "width", /*width*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const fretCount = 17;

    function instance$4($$self, $$props, $$invalidate) {
    	let markRadius;
    	let strings;
    	let frets;
    	let nut;
    	let marks;
    	let notes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Uke', slots, []);
    	let { width = 0 } = $$props;
    	let { height = 0 } = $$props;
    	let { chords = [] } = $$props;
    	let { radius = 0 } = $$props;
    	const writable_props = ['width', 'height', 'chords', 'radius'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Uke> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('chords' in $$props) $$invalidate(7, chords = $$props.chords);
    		if ('radius' in $$props) $$invalidate(8, radius = $$props.radius);
    	};

    	$$self.$capture_state = () => ({
    		createStrings,
    		createFrets,
    		createNut,
    		createMarks,
    		createChords,
    		width,
    		height,
    		chords,
    		radius,
    		fretCount,
    		frets,
    		strings,
    		notes,
    		markRadius,
    		marks,
    		nut
    	});

    	$$self.$inject_state = $$props => {
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('chords' in $$props) $$invalidate(7, chords = $$props.chords);
    		if ('radius' in $$props) $$invalidate(8, radius = $$props.radius);
    		if ('frets' in $$props) $$invalidate(2, frets = $$props.frets);
    		if ('strings' in $$props) $$invalidate(3, strings = $$props.strings);
    		if ('notes' in $$props) $$invalidate(4, notes = $$props.notes);
    		if ('markRadius' in $$props) $$invalidate(9, markRadius = $$props.markRadius);
    		if ('marks' in $$props) $$invalidate(5, marks = $$props.marks);
    		if ('nut' in $$props) $$invalidate(6, nut = $$props.nut);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*radius*/ 256) {
    			$$invalidate(9, markRadius = 0.5 * radius);
    		}

    		if ($$self.$$.dirty & /*width, height*/ 3) {
    			$$invalidate(3, strings = createStrings(width, height));
    		}

    		if ($$self.$$.dirty & /*strings*/ 8) {
    			$$invalidate(2, frets = createFrets(strings, fretCount));
    		}

    		if ($$self.$$.dirty & /*frets*/ 4) {
    			$$invalidate(6, nut = createNut(frets));
    		}

    		if ($$self.$$.dirty & /*frets, markRadius*/ 516) {
    			$$invalidate(5, marks = createMarks(frets, markRadius));
    		}

    		if ($$self.$$.dirty & /*strings, frets, chords, radius*/ 396) {
    			$$invalidate(4, notes = createChords(strings, frets, chords, radius));
    		}
    	};

    	return [width, height, frets, strings, notes, marks, nut, chords, radius, markRadius];
    }

    class Uke extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			width: 0,
    			height: 1,
    			chords: 7,
    			radius: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Uke",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get width() {
    		throw new Error("<Uke>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Uke>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Uke>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Uke>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get chords() {
    		throw new Error("<Uke>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set chords(value) {
    		throw new Error("<Uke>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get radius() {
    		throw new Error("<Uke>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set radius(value) {
    		throw new Error("<Uke>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ChordPicker.svelte generated by Svelte v3.42.4 */

    const file$3 = "src\\components\\ChordPicker.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (58:8) {#each chords as chord}
    function create_each_block_1(ctx) {
    	let button;
    	let t_value = /*chord*/ ctx[11] + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*chord*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "svelte-1xtl527");
    			toggle_class(button, "active", /*selectedChord*/ ctx[0] === /*chord*/ ctx[11]);
    			add_location(button, file$3, 58, 12, 1001);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*selectedChord, chords*/ 5) {
    				toggle_class(button, "active", /*selectedChord*/ ctx[0] === /*chord*/ ctx[11]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(58:8) {#each chords as chord}",
    		ctx
    	});

    	return block;
    }

    // (68:8) {#each flavours as flavour}
    function create_each_block(ctx) {
    	let button;
    	let t_value = /*flavour*/ ctx[8] + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[7](/*flavour*/ ctx[8]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "svelte-1xtl527");
    			toggle_class(button, "active", /*selectedFlavour*/ ctx[1] === /*flavour*/ ctx[8]);
    			add_location(button, file$3, 68, 12, 1278);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*selectedFlavour, flavours*/ 10) {
    				toggle_class(button, "active", /*selectedFlavour*/ ctx[1] === /*flavour*/ ctx[8]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(68:8) {#each flavours as flavour}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let t;
    	let div1;
    	let each_value_1 = /*chords*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*flavours*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "chords svelte-1xtl527");
    			add_location(div0, file$3, 56, 4, 934);
    			attr_dev(div1, "class", "flavours svelte-1xtl527");
    			add_location(div1, file$3, 66, 4, 1205);
    			attr_dev(div2, "class", "outer svelte-1xtl527");
    			add_location(div2, file$3, 54, 0, 888);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div2, t);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selectedChord, chords, setChord*/ 21) {
    				each_value_1 = /*chords*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*selectedFlavour, flavours, setFlavour*/ 42) {
    				each_value = /*flavours*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ChordPicker', slots, []);
    	const chords = ["Ab", "A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G"];

    	// All types that the ukebox crate recognizes
    	const flavours = [
    		"m",
    		"sus2",
    		"sus4",
    		"aug",
    		"dim",
    		"7",
    		"m7",
    		"maj7",
    		"mMaj7",
    		"aug7",
    		"augMaj7",
    		"dim7",
    		"m7b5"
    	];

    	let { selectedChord = "" } = $$props;
    	let { selectedFlavour = "" } = $$props;

    	function setChord(chord) {
    		if (selectedChord === chord) {
    			$$invalidate(0, selectedChord = "");
    			$$invalidate(1, selectedFlavour = "");
    		} else {
    			$$invalidate(0, selectedChord = chord);
    		}
    	}

    	function setFlavour(flavour) {
    		if (selectedChord === "") {
    			return;
    		}

    		if (selectedFlavour === flavour) {
    			$$invalidate(1, selectedFlavour = "");
    		} else {
    			$$invalidate(1, selectedFlavour = flavour);
    		}
    	}

    	const writable_props = ['selectedChord', 'selectedFlavour'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ChordPicker> was created with unknown prop '${key}'`);
    	});

    	const click_handler = chord => setChord(chord);
    	const click_handler_1 = flavour => setFlavour(flavour);

    	$$self.$$set = $$props => {
    		if ('selectedChord' in $$props) $$invalidate(0, selectedChord = $$props.selectedChord);
    		if ('selectedFlavour' in $$props) $$invalidate(1, selectedFlavour = $$props.selectedFlavour);
    	};

    	$$self.$capture_state = () => ({
    		chords,
    		flavours,
    		selectedChord,
    		selectedFlavour,
    		setChord,
    		setFlavour
    	});

    	$$self.$inject_state = $$props => {
    		if ('selectedChord' in $$props) $$invalidate(0, selectedChord = $$props.selectedChord);
    		if ('selectedFlavour' in $$props) $$invalidate(1, selectedFlavour = $$props.selectedFlavour);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		selectedChord,
    		selectedFlavour,
    		chords,
    		flavours,
    		setChord,
    		setFlavour,
    		click_handler,
    		click_handler_1
    	];
    }

    class ChordPicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$3, create_fragment$3, safe_not_equal, { selectedChord: 0, selectedFlavour: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ChordPicker",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get selectedChord() {
    		throw new Error("<ChordPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedChord(value) {
    		throw new Error("<ChordPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedFlavour() {
    		throw new Error("<ChordPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedFlavour(value) {
    		throw new Error("<ChordPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Logo.svelte generated by Svelte v3.42.4 */

    const file$2 = "src\\components\\Logo.svelte";

    function create_fragment$2(ctx) {
    	let h1;
    	let t;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t = text(/*logo*/ ctx[0]);
    			attr_dev(h1, "class", "svelte-1kfwhfk");
    			add_location(h1, file$2, 3, 0, 49);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*logo*/ 1) set_data_dev(t, /*logo*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Logo', slots, []);
    	let { logo } = $$props;
    	const writable_props = ['logo'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Logo> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('logo' in $$props) $$invalidate(0, logo = $$props.logo);
    	};

    	$$self.$capture_state = () => ({ logo });

    	$$self.$inject_state = $$props => {
    		if ('logo' in $$props) $$invalidate(0, logo = $$props.logo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [logo];
    }

    class Logo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$2, create_fragment$2, safe_not_equal, { logo: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Logo",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*logo*/ ctx[0] === undefined && !('logo' in props)) {
    			console.warn("<Logo> was created without expected prop 'logo'");
    		}
    	}

    	get logo() {
    		throw new Error("<Logo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set logo(value) {
    		throw new Error("<Logo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Footer.svelte generated by Svelte v3.42.4 */

    const file$1 = "src\\components\\Footer.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let p;
    	let t0;
    	let a0;
    	let t1;
    	let t2;
    	let br;
    	let t3;
    	let a1;
    	let t4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("Build by ");
    			a0 = element("a");
    			t1 = text(/*name*/ ctx[0]);
    			t2 = space();
    			br = element("br");
    			t3 = text("\r\n        Source code on ");
    			a1 = element("a");
    			t4 = text("GitHub");
    			attr_dev(a0, "href", /*website*/ ctx[1]);
    			add_location(a0, file$1, 7, 17, 123);
    			add_location(br, file$1, 8, 8, 161);
    			attr_dev(a1, "href", /*github*/ ctx[2]);
    			add_location(a1, file$1, 9, 23, 192);
    			add_location(p, file$1, 6, 4, 101);
    			add_location(div, file$1, 5, 0, 90);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(p, a0);
    			append_dev(a0, t1);
    			append_dev(p, t2);
    			append_dev(p, br);
    			append_dev(p, t3);
    			append_dev(p, a1);
    			append_dev(a1, t4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);

    			if (dirty & /*website*/ 2) {
    				attr_dev(a0, "href", /*website*/ ctx[1]);
    			}

    			if (dirty & /*github*/ 4) {
    				attr_dev(a1, "href", /*github*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	let { name } = $$props;
    	let { website } = $$props;
    	let { github } = $$props;
    	const writable_props = ['name', 'website', 'github'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('website' in $$props) $$invalidate(1, website = $$props.website);
    		if ('github' in $$props) $$invalidate(2, github = $$props.github);
    	};

    	$$self.$capture_state = () => ({ name, website, github });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('website' in $$props) $$invalidate(1, website = $$props.website);
    		if ('github' in $$props) $$invalidate(2, github = $$props.github);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, website, github];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$1, create_fragment$1, safe_not_equal, { name: 0, website: 1, github: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console.warn("<Footer> was created without expected prop 'name'");
    		}

    		if (/*website*/ ctx[1] === undefined && !('website' in props)) {
    			console.warn("<Footer> was created without expected prop 'website'");
    		}

    		if (/*github*/ ctx[2] === undefined && !('github' in props)) {
    			console.warn("<Footer> was created without expected prop 'github'");
    		}
    	}

    	get name() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get website() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set website(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get github() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set github(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let wasm;

    let WASM_VECTOR_LEN = 0;

    let cachegetUint8Memory0 = null;
    function getUint8Memory0() {
        if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
            cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachegetUint8Memory0;
    }

    let cachedTextEncoder = new TextEncoder('utf-8');

    const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
        ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
    }
        : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    });

    function passStringToWasm0(arg, malloc, realloc) {

        if (realloc === undefined) {
            const buf = cachedTextEncoder.encode(arg);
            const ptr = malloc(buf.length);
            getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
            WASM_VECTOR_LEN = buf.length;
            return ptr;
        }

        let len = arg.length;
        let ptr = malloc(len);

        const mem = getUint8Memory0();

        let offset = 0;

        for (; offset < len; offset++) {
            const code = arg.charCodeAt(offset);
            if (code > 0x7F) break;
            mem[ptr + offset] = code;
        }

        if (offset !== len) {
            if (offset !== 0) {
                arg = arg.slice(offset);
            }
            ptr = realloc(ptr, len, len = offset + arg.length * 3);
            const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
            const ret = encodeString(arg, view);

            offset += ret.written;
        }

        WASM_VECTOR_LEN = offset;
        return ptr;
    }

    let cachegetInt32Memory0 = null;
    function getInt32Memory0() {
        if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
            cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
        }
        return cachegetInt32Memory0;
    }

    function getArrayU8FromWasm0(ptr, len) {
        return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
    }
    /**
    * Returns unique fret positions of a chord as a slice of fret IDs.
    * Every four items are part of a chord.
    * @param {string} chord
    * @param {string} flavour
    * @returns {Uint8Array}
    */
    function chord_positions(chord, flavour) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(chord, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ptr1 = passStringToWasm0(flavour, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            wasm.chord_positions(retptr, ptr0, len0, ptr1, len1);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v2 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }

    async function load(module, imports) {
        if (typeof Response === 'function' && module instanceof Response) {
            if (typeof WebAssembly.instantiateStreaming === 'function') {
                try {
                    return await WebAssembly.instantiateStreaming(module, imports);

                } catch (e) {
                    if (module.headers.get('Content-Type') != 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                    } else {
                        throw e;
                    }
                }
            }

            const bytes = await module.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);

        } else {
            const instance = await WebAssembly.instantiate(module, imports);

            if (instance instanceof WebAssembly.Instance) {
                return { instance, module };

            } else {
                return instance;
            }
        }
    }

    async function init(input) {
        if (typeof input === 'undefined') {
            input = new URL('uke_shift_bg.wasm', (document.currentScript && document.currentScript.src || new URL('bundle.js', document.baseURI).href));
        }
        const imports = {};


        if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
            input = fetch(input);
        }



        const { instance, module } = await load(await input, imports);

        wasm = instance.exports;
        init.__wbindgen_wasm_module = module;

        return wasm;
    }

    /* src\App.svelte generated by Svelte v3.42.4 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div;
    	let logo_1;
    	let t0;
    	let chordpicker;
    	let updating_selectedChord;
    	let updating_selectedFlavour;
    	let t1;
    	let uke;
    	let t2;
    	let footer;
    	let div_resize_listener;
    	let current;

    	logo_1 = new Logo({
    			props: { logo: /*logo*/ ctx[3] },
    			$$inline: true
    		});

    	function chordpicker_selectedChord_binding(value) {
    		/*chordpicker_selectedChord_binding*/ ctx[8](value);
    	}

    	function chordpicker_selectedFlavour_binding(value) {
    		/*chordpicker_selectedFlavour_binding*/ ctx[9](value);
    	}

    	let chordpicker_props = {};

    	if (/*chord*/ ctx[4] !== void 0) {
    		chordpicker_props.selectedChord = /*chord*/ ctx[4];
    	}

    	if (/*flavour*/ ctx[5] !== void 0) {
    		chordpicker_props.selectedFlavour = /*flavour*/ ctx[5];
    	}

    	chordpicker = new ChordPicker({ props: chordpicker_props, $$inline: true });
    	binding_callbacks.push(() => bind(chordpicker, 'selectedChord', chordpicker_selectedChord_binding));
    	binding_callbacks.push(() => bind(chordpicker, 'selectedFlavour', chordpicker_selectedFlavour_binding));

    	uke = new Uke({
    			props: {
    				width: 0.95 * /*width*/ ctx[6],
    				height: 1 / 6 * 0.95 * /*width*/ ctx[6],
    				radius: 0.013 * 0.95 * /*width*/ ctx[6],
    				chords: /*chords*/ ctx[7]
    			},
    			$$inline: true
    		});

    	footer = new Footer({
    			props: {
    				name: /*name*/ ctx[0],
    				website: /*website*/ ctx[1],
    				github: /*github*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			create_component(logo_1.$$.fragment);
    			t0 = space();
    			create_component(chordpicker.$$.fragment);
    			t1 = space();
    			create_component(uke.$$.fragment);
    			t2 = space();
    			create_component(footer.$$.fragment);
    			add_render_callback(() => /*div_elementresize_handler*/ ctx[10].call(div));
    			add_location(div, file, 33, 1, 1381);
    			attr_dev(main, "class", "svelte-jirsbb");
    			add_location(main, file, 32, 0, 1372);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			mount_component(logo_1, div, null);
    			append_dev(div, t0);
    			mount_component(chordpicker, div, null);
    			append_dev(div, t1);
    			mount_component(uke, div, null);
    			append_dev(div, t2);
    			mount_component(footer, div, null);
    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[10].bind(div));
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const logo_1_changes = {};
    			if (dirty & /*logo*/ 8) logo_1_changes.logo = /*logo*/ ctx[3];
    			logo_1.$set(logo_1_changes);
    			const chordpicker_changes = {};

    			if (!updating_selectedChord && dirty & /*chord*/ 16) {
    				updating_selectedChord = true;
    				chordpicker_changes.selectedChord = /*chord*/ ctx[4];
    				add_flush_callback(() => updating_selectedChord = false);
    			}

    			if (!updating_selectedFlavour && dirty & /*flavour*/ 32) {
    				updating_selectedFlavour = true;
    				chordpicker_changes.selectedFlavour = /*flavour*/ ctx[5];
    				add_flush_callback(() => updating_selectedFlavour = false);
    			}

    			chordpicker.$set(chordpicker_changes);
    			const uke_changes = {};
    			if (dirty & /*width*/ 64) uke_changes.width = 0.95 * /*width*/ ctx[6];
    			if (dirty & /*width*/ 64) uke_changes.height = 1 / 6 * 0.95 * /*width*/ ctx[6];
    			if (dirty & /*width*/ 64) uke_changes.radius = 0.013 * 0.95 * /*width*/ ctx[6];
    			if (dirty & /*chords*/ 128) uke_changes.chords = /*chords*/ ctx[7];
    			uke.$set(uke_changes);
    			const footer_changes = {};
    			if (dirty & /*name*/ 1) footer_changes.name = /*name*/ ctx[0];
    			if (dirty & /*website*/ 2) footer_changes.website = /*website*/ ctx[1];
    			if (dirty & /*github*/ 4) footer_changes.github = /*github*/ ctx[2];
    			footer.$set(footer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(logo_1.$$.fragment, local);
    			transition_in(chordpicker.$$.fragment, local);
    			transition_in(uke.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(logo_1.$$.fragment, local);
    			transition_out(chordpicker.$$.fragment, local);
    			transition_out(uke.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(logo_1);
    			destroy_component(chordpicker);
    			destroy_component(uke);
    			destroy_component(footer);
    			div_resize_listener();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let { name } = $$props;
    	let { website } = $$props;
    	let { github } = $$props;
    	let { logo } = $$props;
    	let width;
    	let chord = "";
    	let flavour = "";
    	let chords = [];

    	function run(c, f) {
    		return __awaiter(this, void 0, void 0, function* () {
    			init();
    			$$invalidate(7, chords = arrayToChords(chord_positions(c, f)));
    		});
    	}

    	const writable_props = ['name', 'website', 'github', 'logo'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function chordpicker_selectedChord_binding(value) {
    		chord = value;
    		$$invalidate(4, chord);
    	}

    	function chordpicker_selectedFlavour_binding(value) {
    		flavour = value;
    		$$invalidate(5, flavour);
    	}

    	function div_elementresize_handler() {
    		width = this.clientWidth;
    		$$invalidate(6, width);
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('website' in $$props) $$invalidate(1, website = $$props.website);
    		if ('github' in $$props) $$invalidate(2, github = $$props.github);
    		if ('logo' in $$props) $$invalidate(3, logo = $$props.logo);
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		arrayToChords,
    		Uke,
    		ChordPicker,
    		Logo,
    		Footer,
    		init,
    		chord_positions,
    		name,
    		website,
    		github,
    		logo,
    		width,
    		chord,
    		flavour,
    		chords,
    		run
    	});

    	$$self.$inject_state = $$props => {
    		if ('__awaiter' in $$props) __awaiter = $$props.__awaiter;
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('website' in $$props) $$invalidate(1, website = $$props.website);
    		if ('github' in $$props) $$invalidate(2, github = $$props.github);
    		if ('logo' in $$props) $$invalidate(3, logo = $$props.logo);
    		if ('width' in $$props) $$invalidate(6, width = $$props.width);
    		if ('chord' in $$props) $$invalidate(4, chord = $$props.chord);
    		if ('flavour' in $$props) $$invalidate(5, flavour = $$props.flavour);
    		if ('chords' in $$props) $$invalidate(7, chords = $$props.chords);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*chord, flavour*/ 48) {
    			run(chord, flavour);
    		}
    	};

    	return [
    		name,
    		website,
    		github,
    		logo,
    		chord,
    		flavour,
    		width,
    		chords,
    		chordpicker_selectedChord_binding,
    		chordpicker_selectedFlavour_binding,
    		div_elementresize_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance, create_fragment, safe_not_equal, { name: 0, website: 1, github: 2, logo: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}

    		if (/*website*/ ctx[1] === undefined && !('website' in props)) {
    			console.warn("<App> was created without expected prop 'website'");
    		}

    		if (/*github*/ ctx[2] === undefined && !('github' in props)) {
    			console.warn("<App> was created without expected prop 'github'");
    		}

    		if (/*logo*/ ctx[3] === undefined && !('logo' in props)) {
    			console.warn("<App> was created without expected prop 'logo'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get website() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set website(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get github() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set github(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get logo() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set logo(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'Kai Wolfram',
            website: 'https://www.kaiwolfram.com/',
            github: 'https://github.com/KaiWitt/uke-shift',
            logo: 'UkeShift'
        }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
