import { encode } from "html-entities";
export const template = async (html, data, builder) => `
<!DOCTYPE html>
<html lang="${data.lang || ""}">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link rel="preconnect" href="https://fonts.googleapis.com">
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		<link href="https://fonts.googleapis.com/css?family=Material+Icons+Outlined&display=block"
			rel="stylesheet" />
		<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&display=swap" rel="stylesheet">
		<link rel="stylesheet" href="/style.css?t=${Date.now()}" />
		<title>Desk framework blog — ${data.title || data.id || ""}</title>
		<meta name="description" content="${encode(data.abstract) || ""}" />
	</head>
	<body class="docpage">
		<div class="docpage_header">
			<a href="/">
				<img
					src="/logo.png"
					class="docpage_header_logo"
					alt="Desk logo"
				/>
			</a>
			<div class="header_links">
				<a href="/docs/en/introduction.html">About</a>
				<a href="/docs/en/">Docs</a>
				<a href="/docs/en/blog"><b>Blog</b></a>
				<a href="https://github.com/desk-framework/desk" target="_blank">
					<img src="/github-mark-white.svg" alt="GitHub" />
				</a>
			</div>
		</div>
		<div class="blogpage_wrapper">
			<article class="blogpage">
				${html}
			</article>
		</div>
		<script src="/script.js"></script>
		<script src=\"/lib/desk-framework-web.es2018.iife.min.js\"></script>
		<script src="/bundle.js"></script>
	</body>
</html>
`;
