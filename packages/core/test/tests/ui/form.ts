import { describe, expect, test, useTestContext } from "@talla-ui/test-handler";
import {
	$activity,
	$view,
	Activity,
	ManagedEvent,
	UIFormContext,
	UILabel,
	UIRow,
	UITextField,
	ViewComposite,
	app,
	strf,
	ui,
} from "../../../dist/index.js";

describe("UIFormContext", () => {
	// helper class to observe a form context and count events
	class ChangeCounter {
		constructor(formContext: UIFormContext) {
			formContext.listen(this);
		}
		handler(formContext: UIFormContext, event: ManagedEvent) {
			if (event.name === "FormChange") this.changes++;
		}
		changes = 0;
	}

	test("Constructor", () => {
		let ctx = new UIFormContext();
		expect(ctx.values).toBeDefined();
		expect(ctx.errors).toBeDefined();
		expect(ctx.valid).toBe(true);
	});

	test("Set, no validation", () => {
		let ctx = new UIFormContext();
		let counter = new ChangeCounter(ctx);
		ctx.set("foo", "bar");
		expect(ctx.values).toHaveProperty("foo").toBe("bar");
		ctx.set("" as any, 123);
		expect(ctx.values).not.toHaveProperty("");
		expect(counter.changes).toBe(1);
	});

	test("Clear values", () => {
		let ctx = new UIFormContext();
		ctx.set("foo", "bar");
		expect(ctx.values).toHaveProperty("foo");
		ctx.clear();
		expect(ctx.values).toBeDefined();
		expect(ctx.errors).toBeDefined();
		expect(ctx.values).not.toHaveProperty("foo");
		expect(ctx.valid).toBe(true);
	});

	test("Validation", (t) => {
		let ctx = new UIFormContext({
			foo: {
				string: {
					required: { err: "Foo is required" },
					min: { length: 3, err: "Too short" },
				},
			},
			baz: { number: {}, optional: true },
		});

		t.log("No validation yet");
		let counter = new ChangeCounter(ctx);
		ctx.set("baz", 123); // no validation
		ctx.set("baz", 123); // nothing happens
		ctx.set("foo", "b"); // no validation
		ctx.set("baz", undefined); // no validation
		expect(counter.changes, "Change counter").toBe(3);
		expect(ctx.valid).toBe(true);
		expect(ctx.errors).not.toHaveProperty("foo");
		expect(ctx.errors).not.toHaveProperty("baz");

		t.log("Calling validate()");
		expect(ctx.validate(), "validate() result").toBeUndefined();
		expect(ctx.errors).toHaveProperty("foo");
		expect(ctx.errors.foo)
			.asString()
			.toMatchRegExp(/Too short/);
		expect(ctx.errors).not.toHaveProperty("baz");
		expect(ctx.valid).toBe(false);
		expect(counter.changes, "Change counter").toBe(4);

		t.log("Set again after validation");
		ctx.set("foo", "b");
		expect(counter.changes, "Change counter").toBe(4);
		ctx.set("foo", "c");
		expect(ctx.errors).toHaveProperty("foo");
		expect(ctx.valid).toBe(false);
		expect(counter.changes, "Change counter").toBe(5);
		ctx.set("foo", "123");
		expect(ctx.errors).not.toHaveProperty("foo");
		expect(ctx.valid).toBe(true);
		expect(ctx.validate()).toBeDefined();
		expect(counter.changes, "Change counter").toBe(6);
	});

	test("Composite, binding to value and error", () => {
		let ERR = "Foo must have at least 3 characters";
		let ctx = new UIFormContext({
			foo: { string: { min: { length: 3, err: strf(ERR) } } },
		}).set("foo", "bar");

		const MyComp = ViewComposite.define(
			{ formContext: undefined as UIFormContext | undefined },
			ui.row(
				ui.label($view.bind("formContext.errors.foo.message")),
				ui.textField({ formField: "foo" }),
			),
		);

		let view = new MyComp();
		expect(view).toHaveProperty("formContext");
		view.render((() => {}) as any); // force render to get reference to body
		let row = view.body as UIRow;
		let [label, tf] = row.content.toArray() as [UILabel, UITextField];
		view.formContext = ctx;

		// set and check text field
		expect(tf.value).toBe("bar");
		ctx.set("foo", 123);
		expect(tf.value).toBe("123");
		expect(label.text).toBe(undefined);

		// set invalid (using text box), validate, and check label
		tf.value = "1";
		tf.emit("Change");
		expect(ctx.validate(), "validate() result").toBeUndefined();
		expect(ctx.errors, "formContext errors").toHaveProperty("foo");
		expect(label.text).asString().toBe(ERR);
	});

	test("Custom form container, rendered", async (t) => {
		useTestContext((options) => {
			options.renderFrequency = 5;
		});
		const FormContainer = ViewComposite.define(
			{ formContext: undefined as UIFormContext | undefined },
			(_, ...content) => ui.column(...content),
		);
		const ViewBody = ui.page(
			ui.row(
				ui.use(
					FormContainer,
					{ formContext: $activity.bind("form1") },
					ui.textField({ formField: "text" }),
				),
				ui.use(
					FormContainer,
					{ formContext: $activity.bind("form2") },
					ui.textField({ formField: "text" }),
				),
			),
		);
		class MyActivity extends Activity {
			protected override createView() {
				return new ViewBody();
			}
			form1 = new UIFormContext().set("text", "foo");
			form2 = new UIFormContext().set("text", "bar");
		}
		let activity = new MyActivity();
		app.addActivity(activity, true);

		// find first text field and change value
		let elt1 = (
			await t.expectOutputAsync(50, { type: "textfield", value: "foo" })
		).getSingle();
		elt1.value = "123";
		elt1.sendPlatformEvent("change");
		expect(activity.form1.values.text).toBe("123");

		// find second text field and set value
		let elt2 = (
			await t.expectOutputAsync(50, { type: "textfield", value: "bar" })
		).getSingle();
		elt2.value = "456";
		elt2.sendPlatformEvent("change");
		expect(activity.form2.values.text).toBe("456");
	});
});