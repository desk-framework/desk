import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { DocItem } from "./DocItem.js";

export class DocBuilder {
	/** The current set of document items */
	items: DocItem[] = [];

	/** Warning messages to be displayed at the end */
	warnings: string[] = [];

	/** Write all items to file as markdown, at the specified path */
	writeItems(outPath: string) {
		if (!existsSync(outPath)) {
			mkdirSync(outPath, { recursive: true });
		}
		let seen: { [outFile: string]: boolean } = {};
		for (let item of this.items) {
			let fileName = String(item.id).replace(/[^\w\.]+/, "_") + ".md";
			let outFile = path.join(outPath, fileName);
			writeFileSync(outFile, item.toMarkdown());
			if (seen[outFile]) {
				this.warnings.push("Overwritten file: " + outFile);
			}
			seen[outFile] = true;
		}
	}
}
