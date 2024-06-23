import * as fs from "node:fs";

const PACKAGES = [
	"packages/frame-core",
	"packages/frame-test",
	"packages/frame-web",
	"packages/test-runner-esbuild",
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
	for (let p in packageJsonObj.peerDependencies) {
		if (PACKAGES.includes(p)) {
			packageJsonObj.peerDependencies[p] = currentVersion;
		}
	}
	fs.writeFileSync(
		`${packagePath}/package.json`,
		JSON.stringify(packageJsonObj, null, "\t") + "\n",
	);
}
