import {
	Activity,
	UIButton,
	UICell,
	UILabel,
	UILabelStyle,
	UIRow,
	app,
	bound,
	useWebContext,
} from "@desk-framework/frame-web";

// Define a label style for the large counter
const CounterLabelStyle = UILabelStyle.extend({
	fontSize: 36,
	bold: true,
});

// @doc-start introduction:sample-view
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
// @doc-end

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

useWebContext();
app.addActivity(new CounterActivity(), true);
