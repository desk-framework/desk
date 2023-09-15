import {
	UIButtonStyle,
	UIColor,
	UIIconResource,
	UIPlainButtonStyle,
	UIPrimaryButtonStyle,
	useWebContext,
} from "../../../dist";
import { CountActivity } from "./counter.js";

useWebContext((options) => {
	options.importCSS = [
		"http://fonts.googleapis.com/icon?family=Material+Icons",
	];
	options.theme.icons.set(
		"face",
		new UIIconResource("<span class='material-icons'>face</span>"),
	);
	options.theme.colors.set("pageBackground", UIColor["@white"]);
	options.theme.colors.set("background", UIColor["@white"].brighten(-0.1));
	// options.theme.colors.set("pageBackground", UIColor["@darkerGray"]);
	// options.theme.colors.set("background", UIColor["@darkerGray"].brighten(0.1));
	// options.messageDialogStyles.ButtonStyle = UIPlainButtonStyle;
	// options.messageDialogStyles.ButtonCellStyle =
	// 	options.messageDialogStyles.ButtonCellStyle.extend({
	// 		borderColor: UIColor["@separator"],
	// 		borderThickness: { top: 1 },
	// 	});
	// options.theme.rowSpacing = 16;
	// options.theme.styles.set(UIButtonStyle, [
	// 	...options.theme.styles.get(UIButtonStyle)!,
	// 	{ minHeight: 48 },
	// ]);
	// options.theme.styles.set(UIPrimaryButtonStyle, [
	// 	...options.theme.styles.get(UIPrimaryButtonStyle)!,
	// 	{ minHeight: 48 },
	// ]);
	// options.messageDialogStyles.ContainerStyle =
	// 	options.messageDialogStyles.ContainerStyle.extend({
	// 		width: 320,
	// 	});
	// options.messageDialogStyles.buttonRowLayout = {
	// 	axis: "vertical",
	// 	gravity: "stretch",
	// 	separator: { space: 8 },
	// };
	// options.messageDialogStyles.reverseButtons = false;
	// options.messageDialogStyles.ButtonCellStyle =
	// 	options.messageDialogStyles.ButtonCellStyle.extend({
	// 		padding: { x: 32, y: 24 },
	// 	});
}).addActivity(new CountActivity(), true);
