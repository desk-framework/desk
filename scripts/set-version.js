import { execSync } from "node:child_process";
import * as fs from "node:fs";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline";

const PACKAGES = [
	"packages/frame-core",
	"packages/frame-test",
	"packages/frame-web",
];

// check if git status is clean
let gitStatus = execSync("git status --porcelain");
if (String(gitStatus).trim().length > 0) {
	console.error("ERROR: Git status is not clean, commit your changes first");
	process.exit(1);
}

// get current version
let packageJson = fs.readFileSync("package.json", "utf-8");
let packageJsonObj = JSON.parse(packageJson);
let currentVersion = packageJsonObj.version;

// ask for new version and publish tag
let rl = readline.createInterface({ input, output });
let newVersion = await new Promise((r) =>
	rl.question(`Current version is ${currentVersion}, enter new version: `, r),
);
newVersion = newVersion.trim();
let newPublishTag = await new Promise((r) =>
	rl.question(`Publish tag (leave empty for 'next'): `, r),
);
newPublishTag = newPublishTag.trim() || "next";
rl.close();

console.log("\n---");
console.log("Setting version to:", newVersion);
console.log("Publish tag:", newPublishTag);

// set main package version
packageJsonObj.version = newVersion;
fs.writeFileSync(
	"package.json",
	JSON.stringify(packageJsonObj, null, "\t") + "\n",
);

// set package versions
for (let packagePath of PACKAGES) {
	let packageJson = fs.readFileSync(`${packagePath}/package.json`, "utf-8");
	let packageJsonObj = JSON.parse(packageJson);
	packageJsonObj.version = newVersion;
	packageJsonObj.publishConfig = { tag: newPublishTag };
	fs.writeFileSync(
		`${packagePath}/package.json`,
		JSON.stringify(packageJsonObj, null, "\t") + "\n",
	);
}
