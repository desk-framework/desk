import * as fs from "node:fs";

const MAIN_PACKAGE = "@desk-framework/frame-core";
const PACKAGES = [
	"packages/frame-core",
	"packages/frame-test",
	"packages/frame-web",
];

// get current version
let packageJson = fs.readFileSync("package.json", "utf-8");
let packageJsonObj = JSON.parse(packageJson);
let currentVersion = packageJsonObj.version;
if (packageJsonObj.name !== "desk-framework") {
	throw new Error("Not running in root package directory");
}

// determine publish tag
let isPre = /[^\d\.]/.test(currentVersion);
let newPublishTag = isPre ? "next" : "latest";

// set package versions
for (let packagePath of PACKAGES) {
	let packageJson = fs.readFileSync(`${packagePath}/package.json`, "utf-8");
	let packageJsonObj = JSON.parse(packageJson);
	packageJsonObj.version = currentVersion;
	packageJsonObj.publishConfig = { tag: newPublishTag };
	if (packageJsonObj.name !== MAIN_PACKAGE) {
		packageJsonObj.peerDependencies[MAIN_PACKAGE] = currentVersion;
	}
	fs.writeFileSync(
		`${packagePath}/package.json`,
		JSON.stringify(packageJsonObj, null, "\t") + "\n",
	);
}
