import { View } from "../../app/index.js";
import { UIComponent } from "../UIComponent.js";
import { UIContainer } from "./UIContainer.js";

/**
 * A view class that represents a column container component
 *
 * @description A column container lays out its contained components vertically.
 *
 * **JSX tag:** `<column>`
 *
 * @online_docs Refer to the Desk website for more documentation on using this UI component class.
 */
export class UIColumn extends UIContainer {
	/** Creates a new column container view object with the provided view content */
	constructor(...content: View[]) {
		super(...content);
	}

	/**
	 * Applies the provided preset properties to this object
	 * - This method is called automatically. Do not call this method after constructing a UI component.
	 */
	override applyViewPreset(
		preset: UIComponent.ViewPreset<UIContainer, this, "width" | "align">,
	) {
		super.applyViewPreset(preset);
	}

	/** Column width, in pixels or CSS length with unit */
	width?: string | number = undefined;

	/**
	 * Alignment of content along the horizontal axis
	 * - If this property is set, its value overrides {@link UIContainer.Layout.gravity layout.gravity}.
	 */
	align?: UIContainer.Layout["gravity"] = undefined;
}
