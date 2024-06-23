import * as fs from "node:fs";

const PACKAGES = {
	"@desk-framework/frame-core": "packages/frame-core",
	"@desk-framework/frame-test": "packages/frame-test",
	"@desk-framework/frame-web": "packages/frame-web",
	"@desk-framework/test-runner-esbuild": "packages/test-runner-esbuild",
};

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
for (let packageName in PACKAGES) {
	let packagePath = PACKAGES[packageName];
	let packageJson = fs.readFileSync(`${packagePath}/package.json`, "utf-8");
	let packageJsonObj = JSON.parse(packageJson);
	packageJsonObj.version = currentVersion;
	packageJsonObj.publishConfig = { tag: newPublishTag };
	for (let p in packageJsonObj.peerDependencies) {
		if (PACKAGES[p]) {
			packageJsonObj.peerDependencies[p] = currentVersion;
		}
	}
	fs.writeFileSync(
		`${packagePath}/package.json`,
		JSON.stringify(packageJsonObj, null, "\t") + "\n",
	);
}
