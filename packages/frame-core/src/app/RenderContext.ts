import { ManagedEvent, ManagedObject, Observer } from "../base/index.js";
import { invalidArgErr } from "../errors.js";
import { app } from "./GlobalContext.js";
import { View } from "./View.js";

/**
 * An abstract class that supports global view rendering, part of the global application context
 * - This class is implemented by a platform renderer, e.g. to render components to the browser DOM, or in-memory (for testing). Most of these methods should not be used directly by an application.
 * - The current renderer, once initialized, should be available as {@link GlobalContext.renderer app.renderer}.
 * @hideconstructor
 */
export abstract class RenderContext extends ManagedObject {
	/** Returns a render callback for root view output; do not use directly */
	abstract getRenderCallback(): RenderContext.RenderCallback;
	/** Creates a new renderer observer for the provided view object; do not use directly */
	abstract createObserver<T extends View>(target: T): Observer<T> | undefined;
	/** Creates a new transformation object for the provided output, if supported */
	abstract transform(
		out: RenderContext.Output,
	): RenderContext.OutputTransform | undefined | void;
	/** Schedules execution of the provided function in the render queue */
	abstract schedule(f: () => void, lowPriority?: boolean): void;
	/** Clears all current root view output */
	abstract clear(): this;
	/** Re-renders output, and relocates existing mounted view output if needed */
	abstract remount(): this;

	/** Uses the provided output transformer to animate a rendered view */
	async animateAsync(
		out: RenderContext.Output,
		transformer: RenderContext.OutputTransformer,
	): Promise<void> {
		let t = this.transform(out);
		if (t) await transformer.applyTransform(t);
	}
}

export namespace RenderContext {
	/** Type definition for the callback that's used for asynchronous rendering */
	export type RenderCallback<TElement = unknown> = (
		output?: Output<TElement>,
		afterRender?: (out?: Output<TElement>) => void,
	) => RenderCallback<TElement>;

	/**
	 * An identifier that specifies a global rendering mode, part of {@link RenderContext.PlacementOptions}
	 *
	 * @description
	 * This type describes how root view output elements are placed among other output. The following options are available:
	 * - `none` — No output should be placed at all.
	 * - `page` — The output should fill the entire screen, on top of other content.
	 * - `dialog` — The output should appear on top of all other output, surrounded by a shaded margin.
	 * - `modal` — The output should appear on top of all other output, surrounded by a shaded margin. A `CloseModal` event is emitted when touching or clicking outside of the modal view area, or pressing the Escape key.
	 * - `mount` — The output should be 'mounted' within an existing output element, with a specified string ID (e.g. HTML element).
	 */
	export type PlacementMode = "none" | "page" | "dialog" | "modal" | "mount";

	/**
	 * Type definition for global rendering placement options
	 *
	 * @description
	 * An object of this type can be provided when rendering a view object using {@link GlobalContext.render app.render()}, or {@link RenderContext.DynamicRendererWrapper}.
	 *
	 * The following properties determine how root view elements are placed on the screen:
	 * - `mode` — One of the {@link RenderContext.PlacementMode} options.
	 * - `mountId` — The mount element ID (e.g. HTML element ID), if `mode` is set to `mount`.
	 * - `ref` — The existing output element that determines the position of modal view output, if any.
	 * - `shade` — True if the modal element should be surrounded by a backdrop shade.
	 * - `transform` — A set of functions or names of theme animations that should run for the view output. By default, showing and hiding (or removing) output can be animated.
	 */
	export type PlacementOptions = Readonly<{
		mode: PlacementMode;
		mountId?: string;
		ref?: Output;
		shade?: boolean;
		transform?: Readonly<{
			show?: OutputTransformer | `@${string}`;
			hide?: OutputTransformer | `@${string}`;
		}>;
	}>;

	/**
	 * An interface for an object that represents transformations to be applied to an output element
	 *
	 * @description
	 * This object encapsulates a view output element, as well as any transformations that can be applied to it. The transformation methods stack particular transformations on top of each other. Timing functions can be used to control the animation speed and curve. To build complex animations that consist of multiple transformations, use a step-wise approach by chaining a call to `step()`.
	 *
	 * This interface is used to control animations within a {@link RenderContext.OutputTransformer}, which can be used on its own, with {@link GlobalContext.animateAsync app.animateAsync}, or from a {@link UIAnimationController}.
	 *
	 * @see {@link RenderContext.OutputTransformer}
	 * @see {@link GlobalContext.animateAsync}
	 */
	export interface OutputTransform<TElement = unknown> {
		/** Returns the output for which this transform has been created */
		getOutput(): Output<TElement>;
		/** Adds a specified delay (in milliseconds) before any transformation takes place */
		delay(ms: number): this;
		/** Sets the timing curve for the current step to linear, with the specified duration (in milliseconds) */
		linear(ms: number): this;
		/** Sets the timing curve for the current step to ease, with the specified duration (in milliseconds) */
		ease(ms: number): this;
		/** Sets the timing curve for the current step to ease-in, with the specified duration (in milliseconds) */
		easeIn(ms: number): this;
		/** Sets the timing curve for the current step to ease-out, with the specified duration (in milliseconds) */
		easeOut(ms: number): this;
		/** Sets a custom bezier timing curve for the current step, with the specified duration (in milliseconds) */
		timing(ms: number, bezier: [number, number, number, number]): this;
		/** Adds a fade effect to the current step, with the specified target opacity */
		fade(opacity: number): this;
		/** Adds a blur effect to the current step, with the specified effect strength (in pixels) */
		blur(strength: number): this;
		/** Adds a (de)saturation effect to the current step, with the specified strength */
		saturate(saturation: number): this;
		/** Sets the transformation origin for the current step */
		origin(x: number, y: number): this;
		/** Adds a translation transformation to the current step */
		offset(x?: number, y?: number): this;
		/** Adds a scale transformation to the current step */
		scale(x?: number, y?: number): this;
		/** Adds a rotatation transformation to the current step */
		rotate(deg: number): this;
		/** Adds a skew transformation to the current step */
		skew(xDeg?: number, yDeg?: number): this;
		/**
		 * Adds an alignment transformation to the current step
		 * @param ref The view output element to which to align
		 * @param origin The current output element (relative) origin to use for alignment ([0,0] - [1,1]), defaults to [0.5,0.5]
		 * @param refOrigin The reference output element (relative) origin to use for alignment ([0,0] - [1,1]), defaults to [0.5,0.5]
		 * @param scaleX The horizontal scale factor to apply
		 * @param scaleY The vertical scale factor to apply
		 */
		align(
			ref?: Output<TElement>,
			origin?: [number, number],
			refOrigin?: [number, number],
			scaleX?: number,
			scaleY?: number,
		): this;
		/**
		 * Adds a smooth offset transition to the current step
		 * - This method stores the _current_ position of the view output element, and animates a transition _from_ this position to the then-current position asynchronously when the transform is invoked.
		 */
		smoothOffset(): OutputTransform;
		/**
		 * Returns a new instance, to add an animation step
		 * @returns A new {@link OutputTransform} instance, which is invoked only after the original instance has completed.
		 */
		step(): OutputTransform;
		/** Returns a promise that's resolved when the transformation has completed */
		waitAsync(): Promise<unknown>;
	}

	/**
	 * An interface that describes an asynchronous transformer for a rendered output element
	 * @see {@link RenderContext.OutputTransform}
	 */
	export interface OutputTransformer<TElement = unknown> {
		applyTransform(transform: OutputTransform<TElement>): Promise<unknown>;
	}

	/**
	 * A platform-dependent effect that can be applied to a rendered output element
	 * - This type is used to apply vidual effects to rendered output elements, when referenced from a UI component style (e.g. {@link UICellStyle}).
	 */
	export interface OutputEffect<TElement = unknown> {
		/** Apply the effect to the provided output element */
		applyEffect(element: TElement, source: View): void;
	}

	/**
	 * An object that encapsulates a rendered output element, created by the global rendering context
	 * @hideconstructor
	 */
	export class Output<TElement = unknown> {
		constructor(source: View, element: TElement, place?: PlacementOptions) {
			this.source = source;
			this.element = element;
			this.place = place;
		}

		/** The rendered view */
		readonly source: View;

		/** The rendered element, as a platform-dependent object or handle */
		readonly element: TElement;

		/** Placement options */
		place?: PlacementOptions;

		/**
		 * Detaches the output element from its previous parent element, if needed
		 * - This method may be set by a previous renderer, to be able to remove the view element from a container element before displaying it as part of another container.
		 */
		detach?: () => void;
	}

	/**
	 * A class that represents a render-related event
	 * - Events of this type are considered internal to the rendered component, and are ignored when coming from attached view objects. In {@link ViewComposite} instances, the {@link ViewComposite.delegateViewEvent()} method doesn't get invoked for renderer events at all. Similarly, {@link UIContainer} doesn't propagate renderer events from attached views.
	 */
	export class RendererEvent extends ManagedEvent {
		/** Always returns true, can be used for duck-typing this type of events */
		isRendererEvent(): true {
			return true;
		}

		/** Render callback, only used for `Render` events to capture output */
		render?: RenderCallback;
	}

	/**
	 * A class that's used to render a view referenced by a property
	 * - Objects of this type are created by the {@link GlobalContext.render app.render()} method, and are mostly used internally to keep track of rendering state asynchronously.
	 *
	 * @hideconstructor
	 */
	export class DynamicRendererWrapper {
		/** The current render callback, if any */
		callback?: RenderCallback;

		/** The view object that was rendered last, if any */
		lastView?: View;

		/** The output that was rendered last, if any */
		lastRenderOutput?: RenderContext.Output;

		/** Returns true if the render method has never been called */
		isRendered() {
			return this._seq > 0;
		}

		/** Renders the provided view using a new callback, or previously stored callback */
		render(
			content?: View,
			callback?: RenderCallback,
			place?: PlacementOptions,
		) {
			let isNewCallback = callback && callback !== this.callback;

			if (
				(!content || isNewCallback) &&
				this.callback &&
				this.lastRenderOutput
			) {
				// use old callback to remove output
				this.callback = this.callback(undefined);
				this.lastView = undefined;
				this.lastRenderOutput = undefined;
				this._ownCallback = undefined;
				this._seq++;
				this._viewObserver?.stop();
			}

			if (isNewCallback) this.callback = callback;
			else if (!callback) callback = this.callback;

			// render content, if possible
			if (content && callback) {
				if (typeof content.render !== "function") {
					throw invalidArgErr("content");
				}
				if (!this._ownCallback || isNewCallback) {
					let seq = this._seq;
					let cb: RenderCallback = (output, afterRender) => {
						if (seq === this._seq) {
							if (output && place) output.place = place;
							this.callback = callback!(output, afterRender);
							this.lastRenderOutput = output;
							let animation = output?.place?.transform?.show;
							if (animation) app.animateAsync(this, animation);
							seq = ++this._seq;
						}
						return cb;
					};
					this._ownCallback = cb;
				}
				this.lastView = content;
				this._viewObserver.observe(content);
				content.render(this._ownCallback);
			}
			return this;
		}

		/** Removes previously rendered output */
		removeAsync() {
			let out = this.lastRenderOutput;
			let seq = this._seq;
			return (async () => {
				if (!this.callback) return;
				let animation = out?.place?.transform?.hide;
				if (animation) await app.animateAsync(this, animation);
				if (seq === this._seq) {
					let resolve: () => void;
					let p = new Promise<void>((r) => {
						resolve = r;
					});
					this.callback = this.callback!(undefined, () => resolve());
					this.lastRenderOutput = undefined;
					this.lastView = undefined;
					this._ownCallback = undefined;
					this._seq++;
					this._viewObserver?.stop();
					return p;
				}
			})();
		}

		private _viewObserver = new (class extends Observer<View> {
			constructor(public wrapper: DynamicRendererWrapper) {
				super();
			}
			override handleUnlink() {
				if (this.wrapper.lastView === this.observed) {
					this.wrapper.removeAsync();
				}
				return super.handleUnlink();
			}
		})(this);

		private _ownCallback: any;
		private _seq = 0;
	}
}
