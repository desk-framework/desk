/**
 * Configuration options
 *
 * The default options are applied to a new instance of this class. Properties will be overridden when read from a config file.
 */
export class Config {
	input: string[] = ["docs/**/*.md"];
	samples: string[] = [];
	refFolder = "";
	docFolder = "";
	output = {
		index: {
			file: ".docgen.out/docgen.index.json",
			urlPrefix: "",
		},
		json: {
			file: ".docgen.out/docgen.out.json",
			pretty: true,
		},
		markdown: {
			path: ".docgen.out/markdown",
			preserveLinks: true,
			yaml: true,
		},
		html: {
			path: ".docgen.out/html",
			templates: "",
			defaultTemplate: "",
		},
	};
	assets: { [dir: string]: string } = {};
}
