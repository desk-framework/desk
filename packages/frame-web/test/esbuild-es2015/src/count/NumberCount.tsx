import {
	BindingOrValue,
	bound,
	JSX,
	ViewComposite,
} from "../../../../lib/desk-framework-web.es2015.esm.min";

export default ViewComposite.define<{ count: BindingOrValue<number> }>(
	<column>
		<label>Count:</label>
		<label labelStyle={{ bold: true, fontSize: 36 }}>
			{bound.number("count")}
		</label>
	</column>,
);
