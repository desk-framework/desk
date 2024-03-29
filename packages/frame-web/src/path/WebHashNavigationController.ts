import {
	NavigationController,
	NavigationTarget,
	app,
} from "@desk-framework/frame-core";
import { type WebContextOptions } from "../WebContext.js";

/** Global flag for global (window) event listener, see constructor */
let _eventListenerAdded = false;

/**
 * A class that manages the application navigation path using the DOM location 'hash' value
 * - This class is used automatically when {@link WebContextOptions.useHistoryAPI} is set to false.
 * @see {@link useWebContext()}
 * @hideconstructor
 */
export class WebHashNavigationController extends NavigationController {
	constructor(options: WebContextOptions) {
		super();
		this._basePath = options.basePath.replace(/^[#\/]+/, "");
		if (!_eventListenerAdded) {
			window.addEventListener("hashchange", () => {
				let self = app.activities.navigationController;
				if (self instanceof WebHashNavigationController) {
					self.update();
				}
			});
			_eventListenerAdded = true;
		}
		this.update();
	}

	private readonly _basePath: string;

	/**
	 * Converts the specified navigation target into a valid `href` value
	 * - This method is also used by the `UIButton` renderer to set the `href` attribute for buttons that are rendered as anchor elements.
	 */
	getPathHref(target?: NavigationTarget): string | undefined {
		if (!target || !target.pageId) return;
		let path = (target.pageId + "/" + target.detail)
			.replace(/^\/+|\/+$/g, "")
			.replace(/\/+/g, "/");
		return "#" + this._basePath + "/" + path;
	}

	/**
	 * Navigates to the specified path
	 * @param target The navigation target
	 * @param mode The intended mode of navigation, see {@link NavigationController.NavigationMode}
	 */
	override async navigateAsync(
		target: NavigationTarget,
		mode?: NavigationController.NavigationMode,
	): Promise<void> {
		if (mode && mode.back) {
			// go back, then continue
			window.history.back();
			if (target && target.pageId) {
				// after going back, navigate to given path
				await new Promise((r) => setTimeout(r, 1));
				return this.navigateAsync(target, { ...mode, back: false });
			}
		} else {
			let href = this.getPathHref(target);
			if (href) {
				if (
					mode &&
					mode.replace &&
					typeof window.history.replaceState === "function"
				) {
					// replace path if possible
					window.history.replaceState({}, document.title, href);
					this.update(); // above doesn't trigger hash change
				} else {
					// just navigate to given path (as hash)
					window.location.hash = href;
				}
			}
		}
	}

	/**
	 * Updates the navigation path from the current location hash value
	 * - This method is called automatically. It shouldn't be necessary to call this method manually in an application.
	 */
	update() {
		let target = String(window.location.hash || "").replace(/^[#\/]+/, "");
		if (this._basePath) {
			if (target.startsWith(this._basePath)) {
				target = target.slice(this._basePath.length).replace(/^[#\/]+/, "");
			} else {
				target = "";
			}
		}
		this._setTarget(target);
	}

	private _setTarget(target: string) {
		let parts = target.replace(/\/$/, "").split("/");
		this.set(parts[0] || "", parts.slice(1).join("/"));
	}
}
