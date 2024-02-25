import {
	app,
	RenderContext,
	ViewClass,
	ViewComposite,
} from "../../app/index.js";
import type { ManagedEvent } from "../../base/ManagedEvent.js";
import type { UIComponent } from "../UIComponent.js";

let _nextUpdateId = 1;

/**
 * A view composite that manages animation playback on the contained view
 *
 * @description An animation controller component can be used to play animations and/or automatically play them when the contained component is shown or hidden.
 *
 * **JSX tag:** `<animation>`
 *
 * @online_docs Refer to the Desk website for more documentation on using this UI component class.
 */
export class UIAnimationController extends ViewComposite {
	/**
	 * Creates a preset controller class with the specified property values, bindings, and event handlers
	 * @param preset Property values, bindings, and event handlers
	 * @returns A class that can be used to create instances of this view class with the provided property values, bindings, and event handlers
	 */
	static with(
		preset: UIComponent.ViewPreset<
			ViewComposite,
			UIAnimationController,
			"showAnimation" | "hideAnimation" | "repeatAnimation"
		>,
		Body: ViewClass,
	): typeof UIAnimationController {
		return class PresetView extends this {
			constructor() {
				super();
				this.applyViewPreset({ ...preset });
			}
			override createView() {
				return new Body();
			}
		};
	}

	/** Plays the specified animation on the last output element rendered by the content view */
	async playAsync(
		animation?: `@${string}` | RenderContext.OutputTransformer,
		repeat?: boolean,
	) {
		// prepare everything in advance
		let renderer = app.renderer;
		let transformer =
			typeof animation === "string"
				? app.theme?.animations.get(animation.slice(1))
				: animation;
		let output = this._lastOutput;
		if (!transformer || !output || !renderer) return;

		// loop if repeating, otherwise run transform just once
		let update = this._lastUpdate;
		while (this.body && this._lastUpdate === update) {
			await renderer.animateAsync(output, transformer);
			if (!repeat) return;
		}
	}

	override render(callback?: RenderContext.RenderCallback) {
		if (callback) {
			let orig = callback;
			let result: RenderContext.RenderCallback = (callback = (
				output,
				afterRender,
			) => {
				let hiding = this._lastOutput && !output;
				let showing = !this._lastOutput && output;
				if (this.hideAnimation && hiding) {
					// removed output: play 'hide' animation, *then* update
					let updateId = _nextUpdateId++;
					this._lastUpdate = updateId;
					this.playAsync(this.hideAnimation)
						.catch((err) => app.log.error(err))
						.then(() => {
							if (this._lastUpdate === updateId) {
								this._lastOutput = undefined;
								orig = orig(output, afterRender);
							}
						});
				} else {
					this._lastOutput = output;
					this._lastUpdate = _nextUpdateId++;
					if (this.showAnimation && showing) {
						// new output: play 'show' animation
						this.playAsync(this.showAnimation).catch((err) =>
							app.log.error(err),
						);
					}
					orig = orig(output, afterRender);

					// after showing output, play 'repeat' animation
					if (this.repeatAnimation) {
						this.playAsync(this.repeatAnimation, true);
					}
				}
				return result;
			});
		}
		return super.render(callback);
	}

	protected override delegateViewEvent(event: ManagedEvent) {
		return super.delegateViewEvent(event) || !!this.emit(event);
	}

	/** Animation that will be played automatically when the content view is shown */
	showAnimation?: `@${string}` | RenderContext.OutputTransformer;

	/** Animation that will be played when the content view is hidden (through `UIComponent.hidden` property or `UIConditional` view) */
	hideAnimation?: `@${string}` | RenderContext.OutputTransformer;

	/** Animation that will be played repeatedly after the content view is shown */
	repeatAnimation?: `@${string}` | RenderContext.OutputTransformer;

	private _lastOutput?: RenderContext.Output;
	private _lastUpdate?: number;
}
