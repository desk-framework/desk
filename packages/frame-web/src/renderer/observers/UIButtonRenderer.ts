import {
	NavigationController,
	app,
	ManagedChangeEvent,
	RenderContext,
	UIButton,
	ui,
	NavigationTarget,
} from "@desk-framework/frame-core";
import { applyStyles } from "../../style/DOMStyle.js";
import { BaseObserver, getBaseStyleClass } from "./BaseObserver.js";
import { setTextOrHtmlContent } from "./UILabelRenderer.js";

interface HrefNavigationController extends NavigationController {
	getPathHref(path?: NavigationTarget): string | undefined;
}

/** @internal */
export class UIButtonRenderer extends BaseObserver<UIButton> {
	override observe(observed: UIButton) {
		return super
			.observe(observed)
			.observePropertyAsync(
				"label",
				"icon",
				"chevron",
				"disabled",
				"width",
				"pressed",
				"style",
			);
	}

	protected override async handlePropertyChange(
		property: string,
		value: any,
		event?: ManagedChangeEvent,
	) {
		if (this.observed && this.element) {
			switch (property) {
				case "label":
				case "icon":
				case "chevron":
					this.scheduleUpdate(this.element);
					return;
				case "disabled":
				case "pressed":
				case "width":
				case "style":
					this.scheduleUpdate(undefined, this.element);
					return;
			}
		}
		await super.handlePropertyChange(property, value, event);
	}

	getOutput() {
		let button = this.observed;
		if (!button) throw ReferenceError();

		let isLink = button.accessibleRole === "link";
		let elt = document.createElement(isLink ? "a" : "button");
		if (!isLink) elt.type = "button";
		let output = new RenderContext.Output(button, elt);

		// make (keyboard) focusable
		elt.tabIndex = button.disableKeyboardFocus ? -1 : 0;

		// set href property if possible
		if (button.navigateTo) {
			let navController = app.activities.navigationController as
				| HrefNavigationController
				| undefined;
			if (navController && typeof navController.getPathHref === "function") {
				let href = navController.getPathHref(button.getNavigationTarget());
				if (href !== undefined) (elt as HTMLAnchorElement).href = href;
			}
		}

		// handle direct clicks with `navigateTo` set
		elt.addEventListener("click", (e) => {
			if (button && button.navigateTo) {
				if (
					(e as MouseEvent).ctrlKey ||
					(e as MouseEvent).altKey ||
					(e as MouseEvent).metaKey
				) {
					// assume OS handles key combo clicks,
					// don't treat as a click at all:
					e.stopPropagation();
					e.stopImmediatePropagation();
				} else {
					// use app to navigate instead, emit an event here:
					e.preventDefault();
					if (!button.disabled) {
						button.emit("Navigate");
					}
				}
			}
		});
		return output;
	}

	override updateStyle(element: HTMLButtonElement) {
		let button = this.observed;
		if (button) {
			// set disabled state
			element.disabled = !!button.disabled;
			if (button.disabled) element.setAttribute("aria-disabled", "true");
			else element.removeAttribute("aria-disabled");

			// set pressed state (true/false/undefined)
			if (button.pressed) element.setAttribute("aria-pressed", "true");
			else if (button.pressed === false)
				element.setAttribute("aria-pressed", "false");
			else element.removeAttribute("aria-pressed");

			// set CSS styles
			applyStyles(
				button,
				element,
				getBaseStyleClass(button.style) ||
					(button.primary ? ui.style.BUTTON_PRIMARY : ui.style.BUTTON),
				undefined,
				true,
				false,
				[
					button.style,
					button.width !== undefined
						? { width: button.width, minWidth: 0 }
						: undefined,
				],
				button.position,
				undefined,
			);
		}
	}

	updateContent(element: HTMLButtonElement) {
		let button = this.observed;
		if (button) {
			setTextOrHtmlContent(
				element,
				{
					text: button.label,
					icon: button.icon,
					iconSize: button.iconSize,
					iconColor: button.iconColor,
					iconMargin: button.iconMargin,
					chevron: button.chevron,
					chevronSize: button.chevronSize,
					chevronColor: button.chevronColor,
				},
				true,
			);
		}
	}
}
