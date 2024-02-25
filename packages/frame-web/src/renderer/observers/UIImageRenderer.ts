import {
	ManagedChangeEvent,
	RenderContext,
	UIImage,
	UIImageStyle,
} from "@desk-framework/frame-core";
import { BaseObserver, getBaseStyleClass } from "./BaseObserver.js";
import { applyStyles } from "../../style/DOMStyle.js";

/** @internal */
export class UIImageRenderer extends BaseObserver<UIImage> {
	override observe(observed: UIImage) {
		return super.observe(observed).observePropertyAsync("url", "imageStyle");
	}

	protected override async handlePropertyChange(
		property: string,
		value: any,
		event?: ManagedChangeEvent,
	) {
		if (this.observed && this.element) {
			switch (property) {
				case "url":
					this.scheduleUpdate(this.element);
					return;
				case "imageStyle":
					this.scheduleUpdate(undefined, this.element);
					return;
			}
		}
		await super.handlePropertyChange(property, value, event);
	}

	getOutput() {
		if (!this.observed) throw ReferenceError();
		let elt = document.createElement("img");
		let output = new RenderContext.Output(this.observed, elt);

		// emit event if image can't be loaded
		elt.onerror = () => {
			if (this.observed) this.observed.emit("LoadError");
		};

		// make (keyboard) focusable if needed
		if (this.observed.allowKeyboardFocus) elt.tabIndex = 0;
		else if (this.observed.allowFocus) elt.tabIndex = -1;
		return output;
	}

	override updateStyle(element: HTMLImageElement) {
		let image = this.observed;
		if (image) {
			applyStyles(
				image,
				element,
				getBaseStyleClass(image.imageStyle) || UIImageStyle,
				undefined,
				false,
				false,
				[image.imageStyle, { width: image.width, height: image.height }],
				image.position,
			);
		}
	}

	updateContent(element: HTMLImageElement) {
		if (!this.observed) return;
		element.src = String(this.observed.url || "");
	}
}
