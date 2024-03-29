import {
	describe,
	expect,
	test,
	useTestContext,
} from "@desk-framework/frame-test";
import {
	ManagedObject,
	UICell,
	ViewComposite,
	app,
	bound,
	ui,
} from "../../../dist/index.js";

describe("UIConditionalView", () => {
	test("Set state directly", () => {
		let MyConditional = ui.conditional({}, UICell);
		let cond = new MyConditional();
		expect(cond.body).toBeUndefined();
		cond.state = true;
		expect(cond.body).toBeInstanceOf(UICell);
		expect(ManagedObject.whence(cond.body)).toBe(cond);
	});

	test("Events are propagated", async (t) => {
		let MyCell = ui.cell(
			ui.conditional({ state: true }, ui.button("Click me", "ButtonClick")),
		);

		// create instance and listen for events on cell
		let cell = new MyCell();
		cell.listen((e) => {
			if (e.name === "ButtonClick") t.count("click");
		});
		app.showPage(cell);
		let expectButton = await t.expectOutputAsync(500, { type: "button" });

		t.log("Clicking button");
		expectButton.getSingle().click();
		t.expectCount("click").toBe(1);
	});

	test("Rendering content using bound state", async (t) => {
		const MyViewComposite = ViewComposite.withPreset<{ condition?: boolean }>(
			{},
			ui.cell(
				ui.conditional(
					{ state: bound("condition") },
					// label should only be rendered when condition is true
					ui.label("foo"),
				),
			),
		);
		const MyView = MyViewComposite.preset({ condition: false });

		t.log("Creating view");
		useTestContext((options) => {
			options.renderFrequency = 5;
		});
		let myView = new MyView();

		t.log("Rendering view");
		app.showPage(myView);

		// after rendering, there should be a cell but no label
		t.log("Checking for cell but no label");
		let expectCell = await t.expectOutputAsync(500, {
			type: "cell",
		});
		expectCell.containing({ text: "foo" }).toBeEmpty();

		// when condition becomes true, label should be rendered
		t.log("Setting state to true");
		myView.condition = true;
		await t.expectOutputAsync(500, { text: "foo" });

		// when condition becomes false, label should be removed
		t.log("Setting state to false");
		myView.condition = false;
		expectCell = await t.expectOutputAsync(500, { type: "cell" });
		expectCell.containing({ text: "foo" }).toBeEmpty();
	});
});
