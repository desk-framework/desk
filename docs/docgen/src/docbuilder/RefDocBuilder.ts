import { encode } from "html-entities";
import { DeclaredItem, PackageParser } from "../index.js";
import { DocBuilder } from "./DocBuilder.js";
import { DocItem } from "./DocItem.js";

const SIGNATURE_KEYWORDS = [
	"class",
	"interface",
	"enum",
	"type",
	"const",
	"let",
	"extends",
	"implements",
	"protected",
	"abstract",
	"in",
	"of",
	"keyof",
	"typeof",
	"boolean",
	"string",
	"number",
	"object",
	"void",
	"null",
	"this",
	"any",
	"never",
	"unknown",
	"undefined",
	"readonly",
];

export class RefDocBuilder extends DocBuilder {
	static fromPackages(...packages: PackageParser[]) {
		let result = new RefDocBuilder();
		for (let p of packages) {
			result.addPackage(p);
		}
		return result;
	}

	packages: PackageParser[] = [];

	addPackage(p: PackageParser) {
		this.packages.push(p);
		this.warnings.push(...p.getWarnings());
		let index = p.getIndex();
		for (let item of index.values()) {
			if (!item.isPage) continue;
			this.addDeclarationItem(p, item);
		}
	}

	addDeclarationItem(p: PackageParser, decl: DeclaredItem) {
		let docItem = new DocItem(decl.id);
		this.items.push(docItem);
		docItem.data.package = p.id;
		docItem.data.id = decl.id;
		docItem.data.ref_title = decl.title;
		docItem.data.parent = decl.parent;
		if (decl.related?.length) docItem.data.related = decl.related;

		// make nicer document title
		let title = decl.id.replace(/.*[\.\[]/, "").replace(/[\[\]]/g, "");
		if (title === "constructor" && decl.parent) {
			title = "new " + decl.parent;
		}
		docItem.data.title = title;

		// compile tags and set as property
		let doctags = "";
		if (decl.isAbstract) doctags += "{@doctag abstract}";
		if (decl.isProtected) doctags += "{@doctag protected}";
		if (decl.isReadonly) doctags += "{@doctag readonly}";
		if (decl.isStatic) doctags += "{@doctag static}";
		if (doctags) docItem.data.doctags = doctags;

		// format signature and set as property
		let signature = this._formatSignature(decl);
		docItem.data.signature = signature;

		// format cross-ref link block and set as property
		let refBlock = "{@link " + decl.id + " " + decl.name + "}";
		if (doctags) refBlock += " " + doctags;
		let abstract = this._expandLinks(decl.abstract, decl);
		refBlock += "<span>" + abstract + "</span>";
		docItem.data.ref_block = refBlock;

		// add title
		docItem.addContent("# " + title);

		// add abstract text, if any
		if (abstract) docItem.addContent("> " + abstract);

		// add tags, if any
		if (doctags) docItem.addContent("{@include doctags}");

		// add signature (pulled from property)
		if (signature) {
			docItem.addContent(
				'<pre class="apisignature">{@include signature}</pre>',
			);
		}

		// add deprecation warning if needed
		if (decl.deprecation) {
			docItem.addSection(
				3,
				"Deprecated",
				"deprecation",
				this._expandLinks(decl.deprecation, decl),
			);
		}

		// add summary and/or notes
		if (decl.summary) {
			docItem.addSection(
				3,
				"Summary",
				"summary",
				this._expandLinks(decl.summary, decl),
			);
		}
		if (decl.notes) {
			docItem.addSection(
				3,
				"Notes",
				"notes",
				this._expandLinks(decl.notes, decl),
			);
		}

		// add function/method information
		if (decl.params?.length) {
			docItem.addSection(
				3,
				"Parameters",
				"params",
				decl.params.map((s) => "- " + this._expandLinks(s, decl)).join("\n"),
			);
		}
		if (decl.returns) {
			docItem.addSection(
				3,
				"Return value",
				"returns",
				this._expandLinks(decl.returns, decl),
			);
		}
		if (decl.throws?.length) {
			docItem.addSection(
				3,
				"Errors",
				"throws",
				decl.throws.map((s) => "- " + this._expandLinks(s, decl)).join("\n"),
			);
		}

		// add description
		if (decl.description) {
			docItem.addSection(
				2,
				"Description",
				"description",
				this._expandLinks(decl.description, decl),
			);
		}

		// add examples
		if (decl.examples?.length) {
			docItem.addSection(
				2,
				decl.examples.length > 1 ? "Examples" : "Example",
				"examples",
				decl.examples.join("\n\n"),
			);
		}
	}

	/** Format given signature string, making keywords bold and adding links to other entries */
	private _formatSignature(declaration: DeclaredItem) {
		let signature =
			(declaration.signature || "") +
			(declaration.extendsNames || []).map((s) => "\n" + s).join("");

		return (
			signature
				// remove JSDoc first
				.replace(/\n\s*\/\*\*([^\*]|\*[^\/])+\*\/\s*\n/g, "\n")
				// split on strings and IDs (only those will match)
				.split(/(\"(?:[^\\\"]|\\.)*\"|[\w\.]+)/)
				// find IDs in the index
				.map((part) => {
					if (/^[A-Z]/.test(part)) {
						for (let p of this.packages) {
							let found = p.findItem(part, declaration);
							if (found) return "{@link " + found.id + " " + part + "}";
						}
					}
					return SIGNATURE_KEYWORDS.includes(part)
						? `<b>${part}</b>`
						: `${encode(part)}`;
				})
				.join("")
		);
	}

	/** Change link tags in specified text to fully qualified ones, so that they refer to doc items, too */
	private _expandLinks(text: string | undefined, declaration: DeclaredItem) {
		return (text || "").replace(
			/\{@link\s+([^\s\}\(\)]+)([^\}]*)\}/g,
			(s, id, rest) => {
				for (let p of this.packages) {
					let found = p.findItem(id, declaration);
					if (found) {
						if (rest === "()") rest = " " + id + "()";
						if (!rest && found.id !== id) rest = " " + id;
						return "{@link " + found.id + rest + "}";
					}
				}
				this.warnings.push(`Invalid link: ${s} in ${declaration.id}`);
				return s;
			},
		);
	}
}
