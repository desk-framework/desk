import {
	app,
	ManagedChangeEvent,
	ManagedObject,
	RenderContext,
	UICell,
	UIComponent,
	UIComponentEvent,
	UIContainer,
	UIStyle,
} from "desk-frame";
import { BaseObserver } from "./BaseObserver.js";
import { getCSSColor, getCSSLength } from "../../style/DOMStyle.js";
import {
	CLASS_SEPARATOR_LINE,
	CLASS_SEPARATOR_LINE_VERT,
	CLASS_SEPARATOR_SPACER,
} from "../../style/defaults/css.js";

/** Debounce DragContainer actions by keeping track of the last start time */
let _dragStart = 0;

/** @internal */
export class UIContainerRenderer<
	TContainer extends UIContainer,
> extends BaseObserver<TContainer> {
	override observe(observed: UIContainer) {
		let result = super
			.observe(observed as any)
			.observePropertyAsync(
				"content",
				"layout",
				"padding",
				"spacing",
				"distribution",
			);
		return result;
	}

	override handleUnlink() {
		if (this.contentUpdater) this.contentUpdater.stop();
		this.contentUpdater = undefined;
		super.handleUnlink();
	}

	protected override async handlePropertyChange(
		property: string,
		value: any,
		event?: ManagedChangeEvent,
	) {
		if (this.observed && this.element) {
			switch (property) {
				case "content":
					this.scheduleUpdate(this.element);
					return;
				case "spacing":
					this.updateSeparator();
					return;
				case "layout":
				case "padding":
				case "distribution":
					this.scheduleUpdate(undefined, this.element);
					return;
			}
		}
		await super.handlePropertyChange(property, value, event);
	}

	getOutput() {
		if (!this.observed) throw ReferenceError();
		let isForm = this.observed.accessibleRole === "form";
		let elt = document.createElement(isForm ? "form" : "container");
		let output = new RenderContext.Output(this.observed, elt);

		// add form submit handler, if needed
		if (isForm) {
			elt.addEventListener("submit", (e) => {
				e.preventDefault();
				if (this.observed) this.observed.emit("Submit", { event: e });
			});
		}

		// add cell mouse handlers, if needed
		if (this.observed instanceof UICell) {
			elt.addEventListener("mouseenter", (e) => {
				if (this.observed) this.observed.emit("MouseEnter", { event: e });
			});
			elt.addEventListener("mouseleave", (e) => {
				if (this.observed) this.observed.emit("MouseLeave", { event: e });
			});
		}

		// make (keyboard) focusable, if needed
		if (this.observed.allowKeyboardFocus) elt.tabIndex = 0;
		else if (this.observed.allowFocus) elt.tabIndex = -1;
		return output;
	}

	/** Last focused component, if this container is keyboard-focusable */
	lastFocused?: UIComponent;

	/** Switch tabindex on focus */
	onFocusIn(e: UIComponentEvent) {
		if (!this.observed || !this.element) return;
		if (e.source !== this.observed && this.observed.allowKeyboardFocus) {
			// temporarily disable keyboard focus on this parent
			// to prevent shift-tab from selecting this element
			this.element.tabIndex = -1;
			this.lastFocused = e.source;
		}
	}

	/** Switch tabindex back on blur */
	onFocusOut(e: UIComponentEvent) {
		if (!this.observed || !this.element) return;
		if (e.source !== this.observed && this.observed.allowKeyboardFocus) {
			// make this parent focusable again
			this.element.tabIndex = 0;
			this.lastFocused = undefined;
		}
	}

	override update(element: HTMLElement) {
		if (this.contentUpdater) {
			// force re-rendering of all content, when render()
			// is called explicitly on container
			this.contentUpdater.stop();
			this.contentUpdater = undefined;
			this.lastSeparator = undefined;
		}
		super.update(element);
	}

	updateContent(element: HTMLElement) {
		let container = this.observed;
		if (!container) return;
		if (!this.contentUpdater) {
			this.contentUpdater = new ContentUpdater(
				container,
				element,
			).setAsyncRendering(container.asyncContentRendering);
			this.updateSeparator();
		}
		let content = container.content;
		this.contentUpdater.update(content);

		// reset tabindex if needed
		if (
			container.allowKeyboardFocus &&
			this.lastFocused &&
			!content.includes(this.lastFocused)
		) {
			if (this.element) this.element.tabIndex = 0;
			this.lastFocused = undefined;
		}
	}

	contentUpdater?: ContentUpdater;

	override updateStyle(
		element: HTMLElement,
		styles?: Partial<UIStyle.Definition>,
	) {
		let container = this.observed;
		if (!container) return;

		let layout: UIStyle.Definition.ContainerLayout = container.layout;
		if (container.distribution)
			layout = { ...layout, distribution: container.distribution };

		let decoration = styles && styles.decoration;
		if (container.padding)
			decoration = { ...decoration, padding: container.padding };

		super.updateStyle(element, {
			...styles,
			containerLayout: layout,
			decoration,
		});
		this.updateSeparator();
	}

	updateSeparator() {
		if (this.observed && this.contentUpdater) {
			let options = this.observed.layout.separator;
			if (!options && this.observed.spacing) {
				let space = this.observed.spacing;
				let vertical = this.observed.layout.axis === "horizontal";
				options =
					this.lastSeparator &&
					this.lastSeparator.space === space &&
					this.lastSeparator.vertical === vertical
						? this.lastSeparator
						: { space, vertical };
			}
			if (this.lastSeparator !== options) {
				this.lastSeparator = options;
				this.contentUpdater.setSeparator(
					options,
					this.observed.layout.axis === "horizontal",
				);
			}
		}
	}
	lastSeparator?: UIStyle.Definition.SeparatorOptions;

	onDragContainer(e: UIComponentEvent<UIContainer, any>) {
		let element = this.element!;
		if (!element) return;
		if (
			_dragStart > Date.now() - 40 ||
			!this.observed ||
			ManagedObject.whence(this.observed) instanceof UIComponent
		)
			return;

		// find original event (e.g. mousedown)
		let event: MouseEvent | TouchEvent | undefined;
		while (e && !event) {
			if (e.data.event && (e.data.event as MouseEvent).type)
				event = e.data.event;
			else if (e.inner) e = e.inner as any;
			else break;
		}
		if (!event || (event as MouseEvent).button) return;

		// check starting coordinates
		let startX =
			((event as TouchEvent).touches &&
				(event as TouchEvent).touches[0]!.screenX) ||
			(event as MouseEvent).screenX;
		let startY =
			((event as TouchEvent).touches &&
				(event as TouchEvent).touches[0]!.screenY) ||
			(event as MouseEvent).screenY;
		if (startX === undefined || startY === undefined) return;

		// found the element and coordinates, start dragging now
		_dragStart = Date.now();
		let moved = false;
		let rect = element.getBoundingClientRect();

		/** Handler that's invoked when the mouse/touch input is moved */
		const moveHandler = (e: MouseEvent | TouchEvent) => {
			let screenX =
				((e as TouchEvent).touches && (e as TouchEvent).touches[0]!.screenX) ||
				(e as MouseEvent).screenX;
			let screenY =
				((e as TouchEvent).touches && (e as TouchEvent).touches[0]!.screenY) ||
				(e as MouseEvent).screenY;
			let diffX = screenX - startX;
			let diffY = screenY - startY;
			if (!moved) {
				if (Math.abs(diffX) < 2 && Math.abs(diffY) < 2) return;
				moved = true;
				let parentNode = element.parentNode as HTMLElement;
				if (parentNode && parentNode.className === "App__ModalWrapper") {
					// make sure the modal wrapper is based at 0, 0
					// (not the case for menu, popover etc.)
					parentNode.style.top = "0";
					parentNode.style.left = "0";
				}
				element.style.position = "absolute";
				element.style.bottom = "auto";
				element.style.right = "auto";
			}
			e.preventDefault();
			e.stopPropagation();
			let y = Math.max(0, rect.top + diffY);
			element.style.top = Math.min(y, window.innerHeight - 40) + "px";
			let x = Math.max(-element.clientWidth + 40, rect.left + diffX);
			element.style.left = Math.min(x, window.innerWidth - 64) + "px";
		};

		/** Handler that's invoked when the mouse button/touch input is released */
		const upHandler = (e: MouseEvent) => {
			if (moved) {
				e.preventDefault();
				e.stopPropagation();
			}
			_dragStart = 0;
			app.renderer!.schedule(() => {
				window.removeEventListener("touchmove", moveHandler, {
					passive: false,
					capture: true,
				} as any);
				window.removeEventListener("mousemove", moveHandler, true);
				window.removeEventListener("touchend", upHandler as any, true);
				window.removeEventListener("mouseup", upHandler, true);
				window.removeEventListener("click", upHandler, true);
			});
		};

		// add all handlers
		window.addEventListener("touchmove", moveHandler, {
			passive: false,
			capture: true,
		});
		window.addEventListener("mousemove", moveHandler, true);
		window.addEventListener("touchend", upHandler as any, true);
		window.addEventListener("mouseup", upHandler, true);
		window.addEventListener("click", upHandler, true);
	}
}

/** @internal Asynchronous container content updater */
export class ContentUpdater {
	constructor(container: UIContainer, element: HTMLElement) {
		this.container = container;
		this.element = element;
	}

	/** The container itself */
	readonly container: UIContainer;

	/** The element for which contents need to be updated */
	readonly element: HTMLElement;

	/** Current list of content items */
	content: RenderContext.Renderable[] = [];

	/** Set async rendering flag; when enabled, all content is rendered asynchronously */
	setAsyncRendering(async?: boolean) {
		this._async = async;
		return this;
	}

	/** Set separator details; possibly update rendered separators */
	setSeparator(
		options?: UIStyle.Definition.SeparatorOptions,
		defaultVertical?: boolean,
	) {
		let sep: HTMLElement | undefined;
		let vertical = (options && options.vertical) ?? defaultVertical;
		if (options && options.lineThickness) {
			let thickness = getCSSLength(options.lineThickness, "");
			let margin = getCSSLength(options.lineMargin, "");
			sep = document.createElement("hr");
			sep.className =
				CLASS_SEPARATOR_LINE +
				(vertical ? " " + CLASS_SEPARATOR_LINE_VERT : "");
			sep.style.borderWidth = thickness;
			sep.style.margin = margin
				? vertical
					? "0 " + margin
					: margin + " 0"
				: "";
			sep.style.borderColor = getCSSColor(options.lineColor || "@Separator");
		} else if (options && options.space) {
			let thickness = getCSSLength(options && options.space, "0");
			sep = document.createElement("spacer" as string);
			sep.className = CLASS_SEPARATOR_SPACER;
			if (vertical) {
				sep.style.width = thickness;
			} else {
				sep.style.height = thickness;
			}
		}
		this._sepTemplate = sep;

		// update all separators now
		if (sep && this._separators.size) {
			let oldSeparators = this._separators;
			this._separators = new Map();
			for (let [content, sep] of oldSeparators.entries()) {
				let newSep = this._getSeparatorFor(content)!;
				this.element.replaceChild(newSep, sep);
			}
		} else if (this.content.length) {
			this.element.innerHTML = "";
			this.awaitUpdateAsync();
		}
		return this;
	}

	/** Stop updating content asynchronously */
	stop() {
		this._stopped = true;
		this._separators = new Map();
		this._output = new Map();
		this.content = [];
		return this;
	}

	/** Update the output element with output from given list of content items (or current) */
	update(content: Iterable<RenderContext.Renderable> = this.content) {
		let element = this.element;

		// resolve the current update promise, or create a resolved promise right away
		if (this._updateResolve) this._updateResolve();
		else this._updateP = Promise.resolve();

		if (!this._stopped) {
			// go through all content items and get their output
			let output: Array<RenderContext.Output<Node> | undefined> = [];
			let contentSet = new Set<RenderContext.Renderable>();
			for (let it of content) {
				contentSet.add(it);
				output.push(this.getItemOutput(it));
			}

			// emit renderer event to allow e.g. animated list content
			this._emitRendering(output);

			// STEP 1: find deleted content and delete elements
			let hasSeparators = this._sepTemplate;
			for (let it of this.content) {
				if (!contentSet.has(it)) {
					let out = this._output.get(it);
					if (out) {
						let elt = out.element as Node;
						if (elt && elt.parentNode === element) {
							if (!elt.previousSibling && hasSeparators && elt.nextSibling) {
								// if first element, remove separator AFTER
								element.removeChild(elt.nextSibling);
							}
							// remove element itself
							element.removeChild(elt);
						}
						this._output.delete(it);
					}
					let sep = hasSeparators && this._getSeparatorFor(it);
					if (sep && sep.parentNode === element) {
						// delete separator (before) for this element, if any
						element.removeChild(sep);
					}
					this._separators.delete(it);
				}
			}
			let newContent = (this.content = [...content]);

			// STEP 2: insert/move element content (and separators)
			let cur = element.firstChild;
			for (let i = 0, len = newContent.length; i < len; i++) {
				let elt = output[i]?.element;
				if (!elt || elt.nodeType === Node.COMMENT_NODE) continue;

				// expect a separator in this position first (if i > 0)
				if (i && hasSeparators) {
					let sep = this._getSeparatorFor(newContent[i]!)!;
					if (cur !== sep) {
						element.insertBefore(sep, cur);
					} else {
						cur = cur && cur.nextSibling;
					}
				}

				// insert correct element next
				if (cur !== elt) {
					element.insertBefore(elt, cur);
				} else {
					cur = cur && cur.nextSibling;
				}
			}

			// STEP 3: remove all leftover elements
			if (cur) {
				while (cur.nextSibling) element.removeChild(cur.nextSibling);
				element.removeChild(cur!);
			}
		}

		// remove (resolved) promises, so that
		// new calls to `awaitUpdateAsync()` will schedule an update
		this._updateP = undefined;
		this._updateResolve = undefined;
	}

	/** Get the current output for given content item, or render it if needed; returns the output, or undefined if the output is still being rendered. */
	getItemOutput(item: RenderContext.Renderable) {
		if (!this._output.has(item)) {
			// set output to undefined first, to avoid rendering again
			this._output.set(item, undefined);
			let isSync = true;
			let lastOutput: RenderContext.Output | undefined;

			// define rendering callback
			const callback: RenderContext.RenderCallback = (output, afterRender) => {
				const scheduleAfter =
					afterRender &&
					(() => {
						if (afterRender && app.renderer) app.renderer.schedule(afterRender);
					});
				if (this._stopped) return callback;
				if (output && lastOutput !== output) {
					// new output received: detach from old parent if any
					if (output.detach) output.detach();
					output.detach = () => {
						if (this._output.get(item) === output) {
							this._output.set(item, undefined);
						}
					};
				}

				// set output for later reference, return if still synchronous
				this._output.set(item, output as any);
				if (isSync) {
					lastOutput = output;
					scheduleAfter && scheduleAfter();
					return callback;
				}

				// async update: delete or replace previous element
				let lastElt = lastOutput && (lastOutput.element as HTMLElement);
				lastOutput = output;
				if (!output || !output.element) {
					// no output... delete last element (and separator) now
					this._emitRendering();
					let sep = this._separators.get(item);
					if (sep && sep.parentNode) this.element.removeChild(sep);
					if (lastElt && lastElt.parentNode) this.element.removeChild(lastElt);
					scheduleAfter && scheduleAfter();
				} else if (lastElt && lastElt.parentNode) {
					// can replace... (and add/move separator if needed)
					this._emitRendering();
					if (lastElt.previousSibling) {
						let sep = this._getSeparatorFor(item);
						if (sep) this.element.insertBefore(sep, lastElt);
					}
					this.element.replaceChild(output!.element as any, lastElt);
					scheduleAfter && scheduleAfter();
				} else {
					// ...otherwise wait for full async update
					this.awaitUpdateAsync().then(() => scheduleAfter && scheduleAfter());
				}
				return callback;
			};

			// invoke render method now or async
			const doRender = () => {
				if (this._stopped) return;
				try {
					item.render(callback);
				} catch (err) {
					app.log.error(err);
				}
			};
			this._async && app.renderer
				? app.renderer.schedule(() => doRender(), true)
				: doRender();

			// set placeholder output if needed, to reduce diffing later
			isSync = false;
			if (!lastOutput) {
				let placeholderElt = document.createComment("@");
				let output = new RenderContext.Output<Node>(item, placeholderElt);
				lastOutput = output;
				this._output.set(item, output);
			}
		}
		return this._output.get(item);
	}

	/** Emit ContentRendering event on container, when deleting or replacing an element */
	private _emitRendering(
		output?: Array<RenderContext.Output<Node> | undefined>,
	) {
		let event = new RenderContext.RendererEvent(
			"ContentRendering",
			this.container,
			{
				output: output || this.content.map((c) => this._output.get(c)),
			},
		);
		this.container.emit(event);
	}

	/** Returns a separator HTML element (if needed) for given content element; if an element already exists it's used, otherwise a new element is created */
	private _getSeparatorFor(content: RenderContext.Renderable) {
		if (this._sepTemplate) {
			let sep = this._separators.get(content);
			if (!sep) {
				sep = this._sepTemplate.cloneNode() as HTMLElement;
				this._separators.set(content, sep);
			}
			return sep;
		}
	}

	/** Returns a promise that's resolved after the current update ends; OR schedules a new update and returns a new promise */
	async awaitUpdateAsync() {
		if (this._updateP) return this._updateP;
		if (this._async) {
			await new Promise((r) => setTimeout(r, 1));
		}
		if (!this._updateP) {
			this._updateP = new Promise((r) => {
				this._updateResolve = r;
			});
			if (app.renderer) app.renderer.schedule(() => this.update());
			else this.update();
		}
		return this._updateP;
	}

	private _stopped?: boolean;
	private _async?: boolean;
	private _updateP?: Promise<void>;
	private _updateResolve?: () => void;
	private _output = new Map<
		RenderContext.Renderable,
		RenderContext.Output<Node> | undefined
	>();
	private _sepTemplate?: HTMLElement;
	private _separators = new Map<RenderContext.Renderable, HTMLElement>();
}
