import { RefDocBuilder, PackageParser } from "@desk-framework/docgen";
import { readFileSync } from "node:fs";

// check if in correct folder
let name = JSON.parse(readFileSync("./package.json").toString()).name;
if (name !== "@desk-framework/docs") {
	console.error("ERROR: Running docs script from wrong folder");
	process.exit(1);
}

// parse packages and create a reference docs builder
const parse = (id, glob) => new PackageParser(id, glob).parse();
const builder = RefDocBuilder.fromPackages(
	parse("frame-core", "node_modules/@desk-framework/frame-core/dist/**/*.d.ts"),
	parse("frame-test", "node_modules/@desk-framework/frame-test/dist/**/*.d.ts"),
	parse("frame-web", "node_modules/@desk-framework/frame-web/dist/**/*.d.ts"),
);

// output markdown files
builder.writeItems("./dist/ref");

// check for warnings (treat as errors)
if (builder.warnings.length > 0) {
	for (let warning of builder.warnings) {
		console.error(`ERROR: ${warning}`);
	}
	process.exit(1);
}
