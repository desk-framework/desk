import hljs from "highlight.js";
import { encode } from "html-entities";
import { minify } from "html-minifier-terser";
import * as yaml from "js-yaml";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";

const marked = new Marked(
	markedHighlight({
		langPrefix: "hljs language-",
		highlight(code, lang) {
			const language = hljs.getLanguage(lang) ? lang : "plaintext";
			let html = hljs.highlight(code, { language }).value;
			let highlighting = 0;
			let lines = html.split("\n").map((line) => {
				let hlMatch = line.match(/([+~]){5,}.*(\d+)/);
				if (hlMatch) {
					highlighting = hlMatch[2] ? +hlMatch[2] : 1;
					let type = hlMatch[1] === "+" ? "good" : "bad";
					return `<span class="hljs--highlight-${type}">`;
				}
				if (highlighting) {
					if (--highlighting === 0) return line + "</span>";
				}
				return line + "\n";
			});
			if (highlighting) lines.push("</span>");
			return lines.join("");
		},
	}),
);

function _checksum1(s: string, bias = 1) {
	let checksum = 0x12345678;
	for (let i = 0; i < s.length; i++) {
		let c = s.charCodeAt(i) + bias,
			d = checksum,
			e = c * d + d * 31;
		checksum = (c + d + e) & 0xffffff;
	}
	return checksum.toString(16).padStart(6, "0");
}
function simpleChecksum(s: string) {
	return _checksum1(s, 0) + "-" + _checksum1(s, 7) + "-" + _checksum1(s, 13);
}

function getHref(from: DocItem, to: DocItem) {
	if (from.outFolder !== to.outFolder) {
		if (from.outFolder && to.outFolder)
			return "../" + to.outFolder + "/" + to.outFile;
		if (from.outFolder) return "../" + to.outFile;
		if (to.outFolder) return to.outFolder + "/" + to.outFile;
	}
	return to.outFile;
}

/** A template function for wrapping a HTML page */
export type DocItemTemplateFunction = (
	html: string,
	data: Record<string, any>,
	delegate: DocItemHtmlDelegate,
) => string | Promise<string>;

/** An interface that is used when converting to HTML */
export interface DocItemHtmlDelegate {
	warn(...msg: string[]): void;
	lookup(id: string): DocItem | undefined;
	query(property: string, value: any): DocItem[];
	getTagText(id: string): string;
	getTemplate(id: string): DocItemTemplateFunction;
}

/** An item that contains data for a (partial) document */
export class DocItem {
	constructor(
		public id: string,
		properties?: Record<string, any>,
		content?: string,
		outFolder?: string,
		outFile?: string,
	) {
		this.data = properties || {};
		this._content = content || "";

		// set output file name, defaults to ID
		this.outFile = outFile || this.getSanitizedId() + ".html";
		if (/[^\w\-\.]/.test(this.outFile)) {
			throw Error("Invalid output file name for " + id + ": " + outFile);
		}

		// set output folder, must be a single word
		this.outFolder = outFolder || "";
		if (/\W/.test(this.outFolder)) {
			throw Error("Invalid output folder for " + id + ": " + outFolder);
		}
	}

	/** Output sub folder (one word only, or empty string) */
	readonly outFolder: string;

	/** Output file name */
	readonly outFile: string;

	/** Additional data (front-matter) related to this document */
	readonly data: Record<string, any>;

	getSanitizedId() {
		return String(this.id)
			.replace(/[\s\:]+/g, "-")
			.replace(/[^\w\-\.]+/g, "_")
			.replace(/\.([a-z])/g, "_$1");
	}

	hasContent() {
		return /\S/.test(this._content);
	}

	setContent(content?: string | DocItem) {
		this._content =
			content instanceof DocItem ? content._content : content || "";
	}

	appendContent(content?: string) {
		if (!this._content.endsWith("\n\n")) this._content += "\n\n";
		this._content += content || "";
	}

	appendSection(level: number, h: string, id: string, content: string) {
		this.appendContent(
			"#".repeat(level) + " " + h + " {#" + id + "}\n\n" + content,
		);
	}

	toMarkdown() {
		let content = this._content.trim();
		let data = { file: this.outFile, folder: this.outFolder, ...this.data };
		let check = simpleChecksum(JSON.stringify(data) + content);
		return (
			"---\n" +
			yaml.dump({ id: this.id, check, ...data }) +
			"---\n\n" +
			content +
			"\n"
		);
	}

	async toHtmlAsync(delegate: DocItemHtmlDelegate) {
		let collated = await this._collateAsync(delegate);
		let html = await marked.parse(collated);
		if (!this.data.lang) delegate.warn("No language set for", this.id);
		if (!this.data.title) delegate.warn("No title set for", this.id);
		if (this.data.template) {
			let template = delegate.getTemplate(this.data.template);
			html = await template(html, { ...this.data }, delegate);
		} else {
			delegate.warn("No template set for", this.id);
		}
		return minify(html, {
			collapseWhitespace: true,
		});
	}

	private async _collateAsync(delegate: DocItemHtmlDelegate) {
		let lines = (this._content || "").split("\n");
		lines = this._expandLinkBlocks(lines, delegate);
		lines = lines.map((line) => {
			line = this._replaceIncludeTags(line);
			line = this._replaceQuery(line, delegate);
			line = this._replaceLinks(line, delegate);
			line = this._replaceTagsText(line, delegate);
			line = this._replaceDoctags(line);
			return this._replaceHeadings(line);
		});
		lines = await this._expandImports(lines, delegate);
		let beforeItem = delegate.lookup(this.id + ":before");
		if (beforeItem) {
			lines.unshift(await beforeItem._collateAsync(delegate), "");
		}
		let afterItem = delegate.lookup(this.id + ":after");
		if (afterItem) {
			lines.push("", await afterItem._collateAsync(delegate));
		}
		return lines.join("\n");
	}

	private async _expandImports(lines: string[], delegate: DocItemHtmlDelegate) {
		let result: string[] = [];
		for (let line of lines) {
			let importMatch = line.match(/^\s*\{@import\s+([^\}]+)\}\s*$/);
			if (importMatch) {
				let importId = importMatch[1]!.trim();
				if (importId.startsWith(":")) importId = this.id + importId;
				let optional = importId.endsWith("?");
				if (optional) importId = importId.slice(0, -1);
				let found = delegate.lookup(importId);
				if (!found && !optional) {
					delegate.warn("Unresolved @import:", importId, "in", this.id);
				}
				let content = await found?._collateAsync(delegate);
				result.push(content || "");
			} else {
				result.push(line);
			}
		}
		return result;
	}

	private _expandLinkBlocks(lines: string[], delegate: DocItemHtmlDelegate) {
		let result: string[] = [];
		let inRefList = false;
		for (let line of lines) {
			let refMatch = line.match(/^-\s*\{@link\s+([\w\.]+)([^\}]*)\}\s*$/);
			if (refMatch) {
				if (!inRefList) result.push('<ul class="refblock_list">');
				inRefList = true;
				let found = delegate.lookup(refMatch[1]!);
				if (!found) {
					delegate.warn(
						"Unresolved @link:",
						refMatch[1]!,
						"from list in",
						this.id,
					);
				}
				let refBlock = found?.data.ref_block || "";
				let refClass = "refblock refblock--" + found?.data.ref_type;
				result.push(`<li class="${refClass}">${refBlock}</li>`);
			} else {
				if (inRefList) result.push("</ul>");
				inRefList = false;
				result.push(line);
			}
		}
		if (inRefList) result.push("</ul>");
		return result;
	}

	private _replaceQuery(line: string, delegate: DocItemHtmlDelegate) {
		return line.replace(
			/^\s*\{@query\s+(\w+)\s+([^\}]+)\}\s*$/,
			(s, property, value) =>
				delegate
					.query(property, value)
					.map((item) => `- {@link ${item.id}}`)
					.join("\n"),
		);
	}

	private _replaceHeadings(line: string) {
		return line.replace(
			/^(#+)\s+(.+)\s*\{#([^\}]+)\}\s*$/,
			(s, h, text, id) =>
				`<h${h.length} id="${id}">${encode(text.trim())}</h${h.length}>`,
		);
	}

	private _replaceDoctags(line: string) {
		return line.replace(
			/\{@doctag\s+([^\}]+)\}/g,
			(s, id) => `<span class="doctag doctag--${id}">${id}</span>`,
		);
	}

	private _replaceLinks(line: string, delegate: DocItemHtmlDelegate) {
		return line.replace(/\{@link\s+([\w\-\.]+)([^\}]*)\}/g, (s, id, rest) => {
			let linkText = rest ? (rest === "()" ? id + "()" : rest) : id;
			linkText = encode(linkText.trim());
			let found = delegate.lookup(id);
			if (!found) {
				delegate.warn("Unresolved @link:", id, "in", this.id);
			}
			let href = found ? getHref(this, found) : "#";
			return `<a href="${href}">${linkText}</a>`;
		});
	}

	private _replaceTagsText(line: string, delegate: DocItemHtmlDelegate) {
		return line.replace(
			/\{@text\s+([^\}]+)\}/g,
			(s, id) =>
				delegate.getTagText(id.trim()) ||
				(delegate.warn("Missing {@text} tag", id, "in", this.id), ""),
		);
	}

	private _replaceIncludeTags(line: string) {
		return line.replace(
			/\{@include\s+([^\}]+)\}/g,
			(s, id) => this.data[id] || "",
		);
	}

	private _content: string;
}
