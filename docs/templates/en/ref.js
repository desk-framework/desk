import { template as docsTemplate } from "./docs.js";
export function template(html, data) {
	data.title += " - Reference";
	html = `
	<div class="ref">
		${html}
	</div>
	`;
	return docsTemplate(html, data);
}
