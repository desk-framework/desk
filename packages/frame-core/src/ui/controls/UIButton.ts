import {
	Binding,
	BindingOrValue,
	StringConvertible,
} from "../../base/index.js";
import type { NavigationTarget, View } from "../../app/index.js";
import type { UIColor } from "../UIColor.js";
import type { UIIconResource } from "../UIIconResource.js";
import { UIComponent } from "../UIComponent.js";
import type { UIStyle } from "../UIStyle.js";

/**
 * A view class that represents a button control
 *
 * @description A button component is rendered on-screen as a button control.
 *
 * @online_docs Refer to the Desk website for more documentation on using this UI component class.
 */
export class UIButton extends UIComponent {
	/** Creates a new button view object with the specified label */
	constructor(label?: StringConvertible) {
		super();
		this.label = label;
	}

	/**
	 * Applies the provided preset properties to this object
	 * - This method is called automatically. Do not call this method after constructing a UI component.
	 */
	override applyViewPreset(
		preset: View.ViewPreset<
			UIComponent,
			this,
			| "label"
			| "icon"
			| "iconSize"
			| "iconMargin"
			| "iconColor"
			| "chevron"
			| "chevronSize"
			| "chevronColor"
			| "navigateTo"
			| "disabled"
			| "width"
			| "pressed"
			| "value"
			| "primary"
			| "style"
		> & {
			/** True if keyboard focus should be disabled this button */
			disableKeyboardFocus?: BindingOrValue<boolean>;
		},
	) {
		// quietly change 'text' to label to support JSX tag content
		if ("text" in (preset as any)) {
			preset.label = (preset as any).text;
			delete (preset as any).text;
		}

		// use a 'link' role automatically if navigation target is specified
		if (preset.navigateTo && !preset.accessibleRole) {
			preset.accessibleRole = "link";
		}

		super.applyViewPreset(preset);
	}

	/** The button label to be displayed */
	label?: StringConvertible;

	/** The button icon to be displayed */
	icon?: UIIconResource = undefined;

	/** Icon size (in pixels or string with unit) */
	iconSize?: string | number;

	/** Space between icon and label text (in pixels or string with unit) */
	iconMargin?: string | number;

	/** Icon color */
	iconColor?: UIColor;

	/** Direction of chevron icon to be placed at the far end of the button, if any */
	chevron?: "up" | "down" | "next" | "back" = undefined;

	/** Chevron icon size (in pixels or string with unit) */
	chevronSize?: string | number;

	/** Chevron icon color */
	chevronColor?: UIColor;

	/**
	 * Path or navigation target to navigate to when this button is clicked
	 * - Set this property to `:back` to go navigate back in the location history stack.
	 */
	navigateTo?: StringConvertible | NavigationTarget;

	/**
	 * The current visual selection state
	 * - This property is not set automatically. It can be set manually, or bound using {@link Binding.match()} to select and deselect the button based on the current value of a property.
	 */
	pressed = false;

	/**
	 * An option value that this button represents, if any
	 * - This property isn't rendered in any way, but it may be used to find out which button was clicked in a group of buttons.
	 */
	value?: string;

	/** True to disable keyboard focus (e.g. Tab key) for this button */
	disableKeyboardFocus?: boolean;

	/** True if user input should be disabled on this control */
	disabled = false;

	/** Target width of this button, in pixels or CSS length with unit */
	width?: string | number = undefined;

	/**
	 * True if the primary button style should be applied to this label
	 * - The primary button style is defined by the theme, identified as PrimaryButton, and also available as `ui.style.BUTTON_PRIMARY`.
	 * - If the {@link style} property is set, this property is ignored.
	 */
	primary?: boolean;

	/** The style to be applied to this button */
	style?: UIStyle.TypeOrOverrides<UIButton.StyleType> = undefined;

	/**
	 * Returns the navigation target for this button
	 * - This method only returns a path (or {@link NavigationTarget} instance) if the {@link UIButton.navigateTo} property is set.
	 * - This method is called automatically by {@link Activity.onNavigate()}.
	 */
	getNavigationTarget() {
		return this.navigateTo;
	}
}

export namespace UIButton {
	/** The type definition for styles applicable to {@link UIButton.style} */
	export type StyleType = UIComponent.DimensionsStyleType &
		UIComponent.DecorationStyleType &
		UIComponent.TextStyleType;
}
