import {
	Activity,
	StringConvertible,
	UITextField,
	ViewComposite,
	ViewEvent,
	app,
	bound,
	ui,
} from "@desk-framework/frame-core";
import { describe, expect, test, useTestContext } from "../../dist/index.js";
// ... from "@desk-framework/frame-test"

class CountActivity extends Activity {
	protected override ready() {
		this.view = new (ui.cell(
			ui.textField({ value: bound("count"), onInput: "SetCount" }),
			ui.button("+", "CountUp"),
		))();
		app.showPage(this.view);
	}
	override navigationPageId = "count";
	count = 0;
	onCountUp() {
		this.count++;
	}
	onSetCount(e: ViewEvent<UITextField>) {
		this.count = +e.source.value! || 0;
	}
}

describe("App test", (scope) => {
	let activity: CountActivity;

	scope.beforeEach(() => {
		// initialize test app before every test
		useTestContext((options) => {
			options.navigationPageId = "count";
		});
		activity = new CountActivity();
		app.addActivity(activity);
	});

	test("Single view is rendered", async (t) => {
		const MyView = ViewComposite.withPreset(
			{ title: StringConvertible.EMPTY },
			ui.label(bound.string("title")),
		).preset({ title: "TEST" });
		let myView = new MyView();
		app.showPage(myView);
		await t.expectOutputAsync(100, { text: "TEST" });
	});

	test("Path activates activity", async (t) => {
		await t.pollAsync(() => activity.isActive(), 5, 100);
	});

	test("Another path inactivates activity", async (t) => {
		// initial path should be set directly
		expect(app.activities.navigationController.pageId).toBe("count");

		// setting another path takes some time
		app.navigate("/another/path/here");
		await t.expectNavAsync(100, "another", "path/here");

		// by then, the activity should be made inactive
		await t.pollAsync(() => !activity.isActive(), 5, 100);
	});

	test("Activity shows view when active", async (t) => {
		let expectCell = await t.expectOutputAsync(100, { type: "cell" });
		expectCell.containing({ value: "0" }).toBeRendered();
		expectCell.containing({ type: "button" }).toBeRendered();
	});

	test("Button increases count", async (t) => {
		// wait for view, then click the button
		(await t.expectOutputAsync(100, { type: "button" }))
			.getSingle()
			.click()
			.click();
		await t.expectOutputAsync(100, { value: "2" });
	});

	test("Entering text sets count property", async (t) => {
		(await t.expectOutputAsync(100, { type: "textfield" }))
			.getSingle()
			.setValue("5");
		await t.expectOutputAsync(100, { value: "5" });
		expect(activity.count).toBe(5);
	});

	test("Button click sets focus", async (t) => {
		// wait for view, then click the button
		let out = await t.expectOutputAsync(100, { type: "button" });
		let btnElement = out.getSingle();
		btnElement.click();
		expect(btnElement.hasFocus()).toBeTruthy();
	});

	test("Alert dialog can be dismissed", async (t) => {
		let p = app.showAlertDialogAsync("Foo");
		let dialog = await t.expectMessageDialogAsync(100, "Foo");
		await dialog.confirmAsync();
		let result = await p;
		expect(result).toBeUndefined();
	});

	test("Confirm dialog can be cancelled", async (t) => {
		let p = app.showConfirmDialogAsync("Foo?");
		await (await t.expectMessageDialogAsync(100, /^Foo/)).cancelAsync();
		let result = await p;
		expect(result).toBeFalsy();
	});

	test("Confirm dialog can be confirmed", async (t) => {
		let p = app.showConfirmDialogAsync((d) => {
			d.messages = ["Foo?", "Bar?"];
			d.confirmLabel = "Yes";
		});
		let dialog = await t.expectMessageDialogAsync(10, /Foo/, /Bar/);
		await dialog.clickAsync("Yes");
		let result = await p;
		expect(result).toBeTruthy();
	});
});
