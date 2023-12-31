import {
	ManagedChangeEvent,
	RenderContext,
	UISpacer,
} from "@desk-framework/frame-core";
import { TestOutputElement } from "../app/TestOutputElement.js";
import { TestBaseObserver, applyElementStyle } from "./TestBaseObserver.js";

/** @internal */
export class UISpacerRenderer extends TestBaseObserver<UISpacer> {
	override observe(observed: UISpacer) {
		return super
			.observe(observed)
			.observePropertyAsync("width", "height", "minWidth", "minHeight");
	}

	protected override async handlePropertyChange(
		property: string,
		value: any,
		event?: ManagedChangeEvent,
	) {
		if (this.observed && this.element) {
			switch (property) {
				case "width":
				case "height":
				case "minWidth":
				case "minHeight":
					this.scheduleUpdate(undefined, this.element);
					return;
			}
		}
		await super.handlePropertyChange(property, value, event);
	}

	getOutput() {
		if (!this.observed) throw ReferenceError();
		let elt = new TestOutputElement("spacer");
		let output = new RenderContext.Output(this.observed, elt);
		elt.output = output;
		return output;
	}

	updateContent() {}

	override updateStyle(element: TestOutputElement) {
		let spacer = this.observed;
		if (spacer) {
			let { width, height, minWidth, minHeight } = spacer;
			let hasMinimum = minWidth !== undefined || minHeight !== undefined;
			let hasFixed = width !== undefined || height !== undefined;
			applyElementStyle(
				element,
				[
					{
						width,
						height,
						minWidth,
						minHeight,
						grow: hasFixed ? 0 : 1,
						shrink: hasMinimum ? 0 : 1,
					},
				],
				spacer.position,
			);
		}
	}
}
