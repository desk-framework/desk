import { execSync } from "node:child_process";
import * as fs from "node:fs";

// check if git status is clean
let gitStatus = execSync("git status --porcelain");
let changes = String(gitStatus).trim().split("\n");
let nonPackageChanges = changes.filter(
	(line) => !/package(-lock)?\.json$/.test(line),
);
if (nonPackageChanges.length > 0) {
	console.error("ERROR: Git status includes other files, aborting...");
	console.error(nonPackageChanges.join("\n"));
	process.exit(1);
}

// get current version
let packageJson = fs.readFileSync("package.json", "utf-8");
let packageJsonObj = JSON.parse(packageJson);
let currentVersion = packageJsonObj.version;

// commit changes and tag
execSync("git add .");
execSync(`git commit -m "${currentVersion}"`);
execSync(`git tag v${currentVersion}`);
