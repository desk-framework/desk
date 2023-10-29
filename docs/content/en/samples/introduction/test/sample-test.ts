// Example test, all in 1 file
// Run (in folder):
// npx tsc -p tsconfig.json && node dist/sample-test.js

import {
	Activity,
	UIButton,
	UICell,
	UILabel,
	UILabelStyle,
	UIRow,
	app,
	bound,
} from "@desk-framework/frame-core";
import {
	describe,
	expect,
	formatTestResults,
	runTestsAsync,
	test,
	useTestContext,
} from "@desk-framework/frame-test";

// Define a label style for the large counter
const CounterLabelStyle = UILabelStyle.extend({
	fontSize: 36,
	bold: true,
});

// Define the page view using static method calls
const AppPage = UICell.with(
	UILabel.with({
		labelStyle: CounterLabelStyle,
		text: bound.strf("Count: %s", "count"),
	}),
	UIRow.with(
		{ align: "center" },
		UIButton.withLabel("Down", "CountDown"),
		UIButton.withLabel("Up", "CountUp"),
	),
);

// Define the activity
class CounterActivity extends Activity {
	// this property will be bound to the label
	count = 0;

	// when ready, show the page
	ready() {
		this.view = new AppPage();
		app.showPage(this.view);
	}

	// event handlers for both buttons
	onCountDown() {
		if (this.count > 0) this.count--;
	}
	onCountUp() {
		this.count++;
	}
}

// @doc-start introduction:sample-test
describe("Example", (scope) => {
	// set up a new test context before each test
	let activity: CounterActivity;
	scope.beforeEach(() => {
		useTestContext();
		activity = new CounterActivity();
		app.addActivity(activity, true);
	});

	// test that the counter is 0 both in the activity and view
	test("Counter starts at zero", async (t) => {
		expect(activity.count).toBe(0);
		await t.expectOutputAsync(100, { text: "Count: 0" });
	});

	// test that the Up button works
	test("Counter goes up", async (t) => {
		// find the button and click it
		let out = await t.expectOutputAsync(100, { type: "button", text: "Up" });
		out.getSingle().click();

		// check that the counter is 1 both in the activity and view
		expect(activity.count).toBe(1);
		await t.expectOutputAsync(100, { text: "Count: 1" });
	});
});
// @doc-end

// run the tests above and print the results
console.log(formatTestResults(await runTestsAsync()));
