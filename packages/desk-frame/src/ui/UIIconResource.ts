import { app } from "../app/index.js";

// NOTE: this class is pretty basic right now, some features could be added
// especially for SVG icons, e.g. rotation, combination, etc.

/**
 * An object that represents an icon that can be used on labels or buttons
 */
export class UIIconResource {
	/** An instance of {@link UIIconResource} that references a blank icon */
	static readonly ["@blank"] = new UIIconResource("@blank");
	/** An instance of {@link UIIconResource} that references the close theme icon */
	static readonly ["@close"] = new UIIconResource("@close");
	/** An instance of {@link UIIconResource} that references the check theme icon */
	static readonly ["@check"] = new UIIconResource("@check");
	/** An instance of {@link UIIconResource} that references the menu theme icon */
	static readonly ["@menu"] = new UIIconResource("@menu");
	/** An instance of {@link UIIconResource} that references the more theme icon */
	static readonly ["@more"] = new UIIconResource("@more");
	/** An instance of {@link UIIconResource} that references the plus theme icon */
	static readonly ["@plus"] = new UIIconResource("@plus");
	/** An instance of {@link UIIconResource} that references the minus theme icon */
	static readonly ["@minus"] = new UIIconResource("@minus");
	/** An instance of {@link UIIconResource} that references the chevronDown theme icon */
	static readonly ["@chevronDown"] = new UIIconResource("@chevronDown");
	/** An instance of {@link UIIconResource} that references the chevronUp theme icon */
	static readonly ["@chevronUp"] = new UIIconResource("@chevronUp");
	/** An instance of {@link UIIconResource} that references the chevronNext theme icon */
	static readonly ["@chevronNext"] = new UIIconResource("@chevronNext");
	/** An instance of {@link UIIconResource} that references the chevronBack theme icon */
	static readonly ["@chevronBack"] = new UIIconResource("@chevronBack");

	/**
	 * Creates a new icon object
	 * @param content The icon content as SVG, HTML, or plain text; or a reference to a dynamic theme icon, using its name prefixed with the `@` character, e.g. `@Close`
	 */
	constructor(content: string) {
		this._content = String(content);
	}

	/** Indicate that this icon should be mirrored in RTL mode */
	setMirrorRTL() {
		this._mRTL = true;
		return this;
	}

	/** True if this icon should be mirrored in RTL mode */
	isMirrorRTL(): boolean {
		if (this._mRTL) return true;
		if (this._content[0] === "@") {
			let icon = app.theme?.icons.get(this._content.slice(1));
			if (icon) return icon.isMirrorRTL();
		}
		return false;
	}

	/** Returns the icon content string, i.e. SVG, HTML, or plain text */
	toString(): string {
		let result = this._content;
		return result[0] === "@"
			? String(app.theme?.icons.get(result.slice(1)) || "")
			: result;
	}

	private _content: string;
	private _mRTL?: boolean;
}

export namespace UIIconResource {}
