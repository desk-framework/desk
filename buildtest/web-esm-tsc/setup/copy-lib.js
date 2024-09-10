const fs = require("fs");

const baseName = "talla-web.es2015.esm.min";
const source = "node_modules/@talla-ui/web/lib/";
const dest = "site/lib/";
const ext = [".js", ".js.gz", ".js.map", ".d.ts"];

if (!fs.existsSync(dest)) fs.mkdirSync(dest);
for (let e of ext) {
	fs.copyFileSync(source + baseName + e, dest + baseName + e);
}
