import {
	ManagedEvent,
	Observer,
	StringConvertible,
	strf,
} from "../../core/index.js";
import { UIComponent } from "../UIComponent.js";
import { UIFormContext, _boundFormContext } from "../UIFormContext.js";
import { UITheme } from "../UITheme.js";

/**
 * A view class that represents a text field control
 *
 * @description A text field component is rendered on-screen as a single-line (default) or multi-line input field.
 *
 * **JSX tag:** `<textfield>`
 *
 * @online_docs Refer to the Desk website for more documentation on using this UI component class.
 */
export class UITextField extends UIComponent {
	/**
	 * Creates a preset text field class with the specified form field name and placeholder
	 * - The form field name is used with the nearest `formContext` property, see {@link UIFormContext}.
	 * - The specified placeholder text is localized using {@link strf} before being set as {@link UITextField.placeholder}.
	 * @param formField The form field name to use
	 * @param placeholder The placeholder text to display when the text field is empty
	 * @returns A class that can be used to create instances of this text field class with the provided form field name and placeholder
	 */
	static withField(formField?: string, placeholder?: StringConvertible) {
		if (typeof placeholder === "string") placeholder = strf(placeholder);
		return this.with({ formField, placeholder });
	}

	/** Creates a new text field view instance */
	constructor(placeholder?: StringConvertible, value?: string) {
		super();
		this.placeholder = placeholder;
		this.value = value || "";
		_boundFormContext.bindTo(this, "formContext");
		new UITextFieldObserver().observe(this);
	}

	/**
	 * Applies the provided preset properties to this object
	 * - This method is called automatically. Do not call this method after constructing a UI component.
	 */
	override applyViewPreset(
		preset: UIComponent.ViewPreset<
			UIComponent,
			this,
			| "placeholder"
			| "value"
			| "type"
			| "multiline"
			| "formField"
			| "enterKeyHint"
			| "disableSpellCheck"
			| "disabled"
			| "readonly"
			| "width"
			| "textFieldStyle"
		> & {
			/** Event that's emitted after the text field has updated and input focus lost */
			onChange?: string;
			/** Event that's emitted when the text field is updated */
			onInput?: string;
			/** Event that's emitted when the user performs a clipboard copy action */
			onCopy?: string;
			/** Event that's emitted when the user performs a clipboard cut action */
			onCut?: string;
			/** Event that's emitted when the user performs a clipboard paste action */
			onPaste?: string;
		},
	) {
		// quietly change 'text' to placeholder to support JSX tag content
		if ("text" in (preset as any)) {
			preset.placeholder = (preset as any).text;
			delete (preset as any).text;
		}
		super.applyViewPreset(preset);
	}

	/**
	 * The current input value
	 * - This field can be preset to initialize the input text.
	 * - This field can be bound, to update and/or initialize the text field with a bound property value.
	 */
	value: string;

	/** The text field placeholder text */
	placeholder?: StringConvertible;

	/**
	 * True if multiline input mode should be enabled
	 * - Setting this property to true also suppresses the EnterKeyPress event.
	 * - This property can't be changed after rendering.
	 */
	multiline?: boolean;

	/** Form context field name, used with {@link UIFormContext} */
	formField?: string = undefined;

	/** The input field type, defaults to `text` */
	type: UITextField.InputType | string = "text";

	/** An optional type that determines the text to be displayed on touch screen 'enter' keys, where supported */
	enterKeyHint?: UITextField.EnterKeyHintType | string;

	/** True if spell and/or grammar checks should be disabled, where supported */
	disableSpellCheck?: boolean;

	/**
	 * The nearest containing form context
	 * - This property is bound automatically, such that it refers to the `formContext` property of the nearest container or view composite.
	 * @see {@link UIFormContext}
	 */
	formContext?: UIFormContext;

	/** True if user input should be disabled on this control */
	disabled = false;

	/** True if the text field should appear like a label */
	readonly = false;

	/** Target width of the text field, in pixels or CSS length with unit */
	width?: string | number = undefined;

	/** The style to be applied to the text field */
	textFieldStyle: UITheme.StyleConfiguration<UITextFieldStyle> = undefined;
}

/** @internal Text field UI component observer to manage the input value automatically */
class UITextFieldObserver extends Observer<UITextField> {
	override observe(observed: UITextField) {
		return super.observe(observed).observeProperty("formContext", "formField");
	}
	onFormFieldChange() {
		this.onFormContextChange();
	}
	onFormContextChange() {
		if (this.observed && this.observed.formContext && this.observed.formField) {
			let value = this.observed.formContext.get(this.observed.formField);
			this.observed.value = value === undefined ? "" : String(value);
		}
	}
	protected override handleEvent(event: ManagedEvent) {
		if (event.name === "Input" || event.name === "Change") {
			let tf = this.observed;
			if (tf && tf.formContext && tf.formField) {
				tf.formContext.set(tf.formField, tf.value, true);
			}
		}
	}
}

export namespace UITextField {
	/** An identifier for a text field input type */
	export type InputType = "text" | "password" | "number" | "date" | "color";

	/** An identifier for a virtual keyboard 'enter' button type, used only on some devices */
	export type EnterKeyHintType =
		| "enter"
		| "done"
		| "go"
		| "next"
		| "previous"
		| "search"
		| "send";
}

/**
 * A style class that includes default style properties for instances of {@link UITextField}
 * - Default styles are taken from {@link UITheme}.
 * - Extend or override this class to implement custom text field styles, see {@link UITheme.BaseStyle} for details.
 */
export class UITextFieldStyle extends UITheme.BaseStyle<
	"TextField",
	UIComponent.DimensionsStyleType &
		UIComponent.DecorationStyleType &
		UIComponent.TextStyleType
> {
	constructor() {
		super("TextField", UITextFieldStyle);
	}
}
