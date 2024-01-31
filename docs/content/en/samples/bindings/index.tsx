import {
	UICell,
	JSX,
	bound,
	Activity,
	app,
	Binding,
} from "@desk-framework/frame-core";
/** @jsx JSX */

{
	// @doc-start bindings:hidden
	const SampleView = (
		<cell>
			<row>
				<button onClick="ToggleDetails">Toggle</button>
			</row>
			<cell hidden={bound.not("showDetails")}>
				<label>Details go here...</label>
			</cell>
		</cell>
	);

	class SampleActivity extends Activity {
		showDetails?: boolean;

		ready() {
			this.view = new SampleView();
			app.showPage(this.view);
		}

		onToggleDetails() {
			this.showDetails = !this.showDetails;
		}
	}
	// @doc-end
}
{
	// @doc-start bindings:list
	const View = (
		<cell>
			<list items={bound.list("customers")}>
				<row>
					<label>%[item.name]</label>
				</row>
			</list>
			<row hidden={bound("customers.count")}>
				<label>No matching customers</label>
			</row>
		</cell>
	);
	// @doc-end
}
{
	// @doc-start bindings:jsx
	// A view with automatic JSX string-formatted bindings
	const View = (
		<cell>
			<label>Report for %[today:local|date]</label>
			<list items={bound.list("customerTickets")}>
				<row>
					<label>%[item.name]</label>
					<label>%[item.nClosed] / %[item.total]</label>
				</row>
			</list>
		</cell>
	);
	// @doc-end
}
{
	// @doc-start bindings:debug
	// add a listener before starting the application:
	Binding.debugEmitter.listen((e) => {
		if (e.data.bound) {
			console.log("Bound: " + e.data.binding, e.data.value);
		} else {
			console.log("Unbound: " + e.data.binding);
		}
	});
	// @doc-end
}
