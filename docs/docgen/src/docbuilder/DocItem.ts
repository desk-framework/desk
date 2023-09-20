import * as yaml from "js-yaml";

/** An item that contains data for a (partial) document */
export class DocItem {
	constructor(
		public id: string,
		properties?: Record<string, any>,
		content?: string,
	) {
		this.data = properties || {};
		this.content = content || "";
	}

	/** Markdown content */
	content: string;

	/** Additional data (front-matter) related to this document */
	data: Record<string, any>;

	addContent(content?: string) {
		if (!this.content.endsWith("\n\n")) this.content += "\n\n";
		this.content += content || "";
	}

	addSection(level: number, h: string, id: string, content: string) {
		this.addContent(
			"#".repeat(level) + " " + h + " {#" + id + "}\n\n" + content,
		);
	}

	toMarkdown() {
		let front = "---\n" + yaml.dump(this.data) + "---\n\n";
		return front + this.content.trim() + "\n";
	}
}
