import {
	Activity,
	JSX,
	UIButton,
	UICell,
	UILabel,
	UILabelStyle,
	UIRow,
	app,
	bound,
	useWebContext,
} from "@desk-framework/frame-web";
/** @jsx JSX */

// @doc-start introduction:sample-style
// Define a label style for the large counter
const CounterLabelStyle = UILabelStyle.extend({
	fontSize: 36,
	bold: true,
});
//@doc-end

// @doc-start introduction:sample-view-jsx
// Define the page view using JSX
const AppPage = (
	<cell>
		<label labelStyle={CounterLabelStyle}>Count: %[count]</label>
		<row align="center">
			<button onClick="CountDown">Down</button>
			<button onClick="CountUp">Up</button>
		</row>
	</cell>
);
// @doc-end

{
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
	AppPage;
}
{
	const AppPage = UICell.with(
		// @doc-start introduction:sample-inline-style
		// ...
		UILabel.with({
			labelStyle: { bold: true, fontSize: 36 },
			text: bound.strf("Count: %s", "count"),
		}),
		// @doc-end
	);
	AppPage;
}

// @doc-start introduction:sample-activity
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
// @doc-end

// @doc-start introduction:sample-app
useWebContext();
app.addActivity(new CounterActivity(), true);
// @doc-end
