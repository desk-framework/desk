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

/** A function for wrapping HTML content into a page template */
export type DocItemTemplateFunction = (
	html: string,
	data: Record<string, any>,
	delegate: DocItemHtmlDelegate,
) => string | Promise<string>;

/** An interface that is used when converting to HTML */
export interface DocItemHtmlDelegate {
	warn(...msg: string[]): void;
	lookup(id: string): DocItem | undefined;
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
		if (/[^\w\-]/.test(this.outFolder)) {
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

	appendSection(level: number, h: string, id?: string, content?: string) {
		let suffix = id ? " {#" + id + "}" : "";
		this.appendContent(
			"#".repeat(level) + " " + h + suffix + "\n\n" + (content || ""),
		);
	}

	getMenuItems(delegate: DocItemHtmlDelegate) {
		if (Array.isArray(this.data.menu)) {
			return this.data.menu.map((s) => String(s));
		}

		// build menu from headings, imports, and `+` links
		let result: string[] = [];
		let lines = this._content.split("\n");
		for (let line of lines) {
			let hMatch = line.match(/^\#{2,3}\s+(.*)\s+\{\#(.*)\}\s*$/);
			if (hMatch) {
				result.push("#" + hMatch[2] + " " + hMatch[1]);
				continue;
			}
			let importMatch = line.match(/^\s*\{@import\s+([^\}]+)\}\s*$/);
			if (importMatch) {
				let importId = importMatch[1]!.trim().replace(/\?$/, "");
				if (importId.startsWith(":")) importId = this.id + importId;
				let found = delegate.lookup(importId);
				if (found) result.push(...found.getMenuItems(delegate));
				continue;
			}
			let linkRE = /\{@link\s+([\w\-\.]+)\s*\+/g;
			let linkMatch: RegExpExecArray | null;
			while ((linkMatch = linkRE.exec(line))) {
				result.push(linkMatch[1]!);
			}
		}
		return result;
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
		this.data.menu_html = this._getMenuHtml(delegate);
		this.data.breadcrumb_html = this._getBreadcrumbHtml(delegate);
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

	async getFieldHtmlAsync(field: string, delegate: DocItemHtmlDelegate) {
		let text = this.data[field] || "";
		text = this._replaceIncludeTags(text);
		text = this._replaceLinks(text, delegate, true);
		text = this._replaceTagsText(text, delegate);
		text = this._replaceDoctags(text);
		let html = await marked.parseInline(text);
		return minify(html, { collapseWhitespace: true });
	}

	private _getMenuHtml(delegate: DocItemHtmlDelegate) {
		const makeLink = (menuItem: DocItem, menuId: string, current?: boolean) => {
			if (menuId.startsWith("#")) {
				let idx = menuId.indexOf(" ");
				let href = getHref(this, menuItem) + menuId.slice(0, idx);
				let title = menuId.slice(idx + 1);
				return `<li class="menu-item menu-item--heading"><a href="${href}">${title}</a></li>`;
			}
			let found = delegate.lookup(menuId);
			let href = found ? getHref(this, found) : "#";
			let title = found?.data.menu_title || found?.data.title || menuId;
			let className =
				"menu-item menu-item--" + (found?.data.menu_type || "doc");
			if (current) className += " menu-item--current";
			let attr = `class="${className}"`;
			if (current) attr += ` id="current-menu-item"`;
			return `<li ${attr}"><a href="${href}">${title}</a></li>\n`;
		};

		// warn if no menu parent is set
		if (!this.data.menu_parent && !this.data.menu_root) {
			delegate.warn("Orphaned document:", this.id);
		}

		// add all parents and siblings (upwards)
		let item: DocItem | undefined = this;
		let result = "";
		while (item) {
			let isRoot = !!item.data.menu_root;
			let parentId = item.data.menu_parent;
			let parent = delegate.lookup(parentId);
			let parentMenu = parent?.data.menu || [item.id];
			let itemResult = "";
			for (let siblingId of parentMenu) {
				let isCurrent = siblingId === this.id;
				if (!isRoot) {
					// add list item for this document
					itemResult += makeLink(parent || item, siblingId, isCurrent);
				}
				if (isCurrent) {
					// add list items for children of current
					itemResult +=
						`<ul>\n` +
						(item.data.menu || [])
							.map((id: string) => makeLink(this, id))
							.join("") +
						`</ul>\n`;
				} else if (siblingId === item.id) {
					// add previous list (nested)
					itemResult += result;
				}
			}
			item = parent;
			result = isRoot ? itemResult : `<ul class="menu">\n${itemResult}</ul>\n`;
		}

		// parse header text and includes, if any
		result = this._replaceIncludeTags(result);
		result = this._replaceTagsText(result, delegate);
		return result;
	}

	private _getBreadcrumbHtml(delegate: DocItemHtmlDelegate) {
		let parentId = this.data.menu_parent;
		let parent = delegate.lookup(parentId);
		let title = parent?.data.menu_title || parent?.data.title;
		let result = parentId ? `{@link ${parentId} ${title}}` : "";
		result = this._replaceTagsText(result, delegate);
		result = this._replaceLinks(result, delegate);
		return result;
	}

	private async _collateAsync(
		delegate: DocItemHtmlDelegate,
		noReplace?: boolean,
	) {
		let lines = (this._content || "").split("\n");
		lines = await this._expandImports(lines, delegate);
		let beforeItem = delegate.lookup(this.id + ":before");
		if (beforeItem) {
			lines.unshift(await beforeItem._collateAsync(delegate, true), "");
		}
		let afterItem = delegate.lookup(this.id + ":after");
		if (afterItem) {
			lines.push("", await afterItem._collateAsync(delegate, true));
		}
		lines = this._expandLinkBlocks(lines, delegate);
		if (!noReplace) {
			lines = lines.map((line) => {
				line = this._replaceIncludeTags(line);
				line = this._replaceLinks(line, delegate);
				line = this._replaceTagsText(line, delegate);
				line = this._replaceDoctags(line);
				return this._replaceHeadings(line);
			});
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
				let content = await found?._collateAsync(delegate, true);
				result.push(...(content ? content.split("\n") : ""));
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
			let refMatch = line.match(/^-\s*\{@link\s+([\w\-\.]+)([^\}]*)\}\s*$/);
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
				} else if (found.data.ref_block) {
					let refBlock = found.data.ref_block;
					let refClass = "refblock refblock--" + found.data.ref_type;
					result.push(`<li class="${refClass}">${refBlock}</li>`);
				} else {
					let refLink = `{@link ${found.id} ${found.data.title || found.id}}`;
					let abstract = found.data.abstract || "";
					let refBlock = refLink + `<span>${abstract}</span>`;
					result.push(`<li class="refblock refblock--doc">${refBlock}</li>`);
				}
			} else {
				if (inRefList) result.push("</ul>");
				inRefList = false;
				result.push(line);
			}
		}
		if (inRefList) result.push("</ul>");
		return result;
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

	private _replaceLinks(
		line: string,
		delegate: DocItemHtmlDelegate,
		textOnly?: boolean,
	) {
		return line.replace(/\{@link\s+([\w\-\.]+)([^\}]*)\}/g, (s, id, rest) => {
			let linkText = rest ? (rest === "()" ? id + "()" : rest) : id;
			linkText = encode(linkText.trim());
			if (textOnly) return linkText;
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
