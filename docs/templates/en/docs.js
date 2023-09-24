export const template = async (html, data) => `
<!DOCTYPE html>
<html lang="${data.lang || ""}">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link
			href="https://fonts.googleapis.com/css?family=Material+Icons&display=block"
			rel="stylesheet"
		/>
		<link
			href="https://fonts.googleapis.com/css?family=IBM+Plex+Mono:300,500,400i|IBM+Plex+Sans:300,500,800,300i,500i&display=swap"
			rel="stylesheet"
		/>
		<link rel="stylesheet" href="/style.css?t=${Date.now()}" />
		<title>Desk framework - ${data.title || data.id || ""}</title>
	</head>
	<body>
		<article>
			${html}
		</article>
	</body>
</html>
`;
