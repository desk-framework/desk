import { DocBuilder, SourceDocBuilder } from "@desk-framework/docgen";
import { readFileSync } from "node:fs";

// check if in correct folder
let name = JSON.parse(readFileSync("./package.json").toString()).name;
if (name !== "@desk-framework/docs") {
	console.error("ERROR: Running docs script from wrong folder");
	process.exit(1);
}

// read files from different input folders to merge below
let builder = await new DocBuilder()
	.copyAssets("./content/index/*", "../_site")
	.copyAssets("./content/en/assets/**/*", "../_site/docs/en/assets")
	.setTemplate("docs", await import("../templates/en/docs.js"))
	.setTemplate("ref", await import("../templates/en/ref.js"))
	.setTagText({
		CONSTRUCTOR: "Constructor",
		TYPEMEMBERS: "Type Members",
		STATICMEMBERS: "Static Members",
		INSTANCEMEMBERS: "Instance Members",
		INHERITED: "Inherited",
		DEPRECATED: "Deprecated",
		RELATED: "Related",
	})
	.readItems("./content/en/_docgen_/*.md")
	.merge(
		new DocBuilder().readItems("./content/en/docs/*.md", {
			lang: "en-US",
			template: "docs",
		}),
	)
	.merge(SourceDocBuilder.fromSource("./content/en/samples/*.ts", "ts"))
	.writeHtmlAsync("../_site/docs/en");

// display warnings (as errors)
let errors = builder.getWarnings();
if (errors.length > 0) {
	for (let msg of errors) {
		console.error(`ERROR: ${msg}`);
	}
	console.error("-- Completed with errors");
	process.exit(1);
}
