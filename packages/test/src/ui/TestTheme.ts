import {
	app,
	MessageDialogOptions,
	RenderContext,
	strf,
	StringConvertible,
	UIButton,
	UICell,
	UILabel,
	UISeparator,
	UITheme,
	ViewComposite,
} from "desk-frame";

/** @internal Limited implementation of a message dialog controller, that can be used to test for message display and button presses */
class TestMessageDialog
	extends ViewComposite
	implements UITheme.AlertDialogController, UITheme.ConfirmDialogController
{
	constructor(public options: MessageDialogOptions) {
		super();
	}

	setAlertButton() {
		this.confirmLabel = this.options.confirmLabel || strf("Dismiss");
		return this;
	}

	setConfirmButtons() {
		this.confirmLabel = this.options.confirmLabel || strf("Confirm");
		this.cancelLabel = this.options.cancelLabel || strf("Cancel");
		this.otherLabel = this.options.otherLabel;
		return this;
	}

	confirmLabel?: StringConvertible;
	cancelLabel?: StringConvertible;
	otherLabel?: StringConvertible;

	showAsync(place?: Partial<RenderContext.PlacementOptions>) {
		let rendered = app.render(this, {
			mode: "dialog",
			...place,
		});

		// return a promise that's resolved when one of the buttons is pressed
		return new Promise<{ confirmed: boolean; other?: boolean }>((r) => {
			this._resolve = (result) => {
				rendered.removeAsync();
				r(result);
			};
		});
	}

	protected override createView() {
		return new (UICell.with(
			{ accessibleRole: "alertdialog" },
			...this.options.messages.map((text) => UILabel.withText(text)),
			UIButton.with({
				label: this.confirmLabel,
				onClick: "+Confirm",
				requestFocus: true,
			}),
			UIButton.with({
				hidden: !this.otherLabel,
				label: this.otherLabel,
				onClick: "+Other",
			}),
			UIButton.with({
				hidden: !this.cancelLabel,
				label: this.cancelLabel,
				onClick: "+Cancel",
			}),
		))();
	}

	onConfirm() {
		this._resolve?.({ confirmed: true });
	}
	onOther() {
		this._resolve?.({ confirmed: false, other: true });
	}
	onCancel() {
		this._resolve?.({ confirmed: false });
	}
	onEscapeKeyPress() {
		this._resolve?.({ confirmed: false });
	}

	private _resolve?: (result: { confirmed: boolean; other?: boolean }) => void;
}

/** @internal Limited implementation of a menu controller, that can be used to test menu selection using label clicks */
class TestModalMenu extends ViewComposite implements UITheme.MenuController {
	constructor(public options: UITheme.MenuOptions) {
		super();
	}

	async showAsync(place?: Partial<RenderContext.PlacementOptions>) {
		// render the view, keep a reference in order to remove it later
		let handler = app.render(this, {
			mode: "modal",
			...place,
		});

		// return a promise that's resolved when one of the items is selected
		// or when the menu is dismissed otherwise
		// (remember resolve function for later)
		return new Promise<{ key: string } | undefined>((r) => {
			this._resolve = (key) => {
				handler.removeAsync();
				r(key ? { key } : undefined);
			};
		});
	}

	override createView() {
		// create modal container
		let container = new UICell();
		container.accessibleRole = "menu";

		// add menu items with label and/or hint
		for (let item of this.options.items) {
			if (item.separate) {
				// add a separator
				container.content.add(new UISeparator());
				continue;
			}

			// add a menu item
			let itemRow = new UICell();
			itemRow.accessibleRole = "menuitem";
			itemRow.allowFocus = true;
			itemRow.allowKeyboardFocus = true;
			container.content.add(itemRow);
			let itemLabel = new UILabel(item.text);
			itemRow.content.add(itemLabel);
			if (item.icon) itemLabel.icon = item.icon;
			if (item.hint || item.hintIcon) {
				let hintLabel = new UILabel(item.hint);
				if (item.hintIcon) hintLabel.icon = item.hintIcon;
				itemRow.content.add(hintLabel);
			}

			// add an observer to register clicks and keyboard input
			itemRow.listen((e) => {
				if (e.name === "Click") {
					this._resolve?.(item.key);
				}
			});
		}
		return container;
	}

	onEscapeKeyPress() {
		this._resolve?.();
	}

	onCloseModal() {
		this._resolve?.();
	}
	private _resolve?: (key?: string) => void;
}

/** @internal Modal view implementation for the test context */
export class TestModalFactory implements UITheme.ModalControllerFactory {
	buildAlertDialog(options: MessageDialogOptions) {
		return new TestMessageDialog(options).setAlertButton();
	}
	buildConfirmDialog(options: MessageDialogOptions) {
		return new TestMessageDialog(options).setConfirmButtons();
	}
	buildMenu(options: UITheme.MenuOptions) {
		return new TestModalMenu(options);
	}
}

/** @internal */
export class TestTheme extends UITheme {
	constructor() {
		super();
		this.modalFactory = new TestModalFactory();
	}
}
