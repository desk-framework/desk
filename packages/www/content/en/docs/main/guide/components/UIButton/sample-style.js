const styles = {
	dangerousButton: desk.UIStyle.PrimaryButton.extend(
		{
			decoration: {
				background: desk.UIColor["@red"],
				borderColor: desk.UIColor["@red"],
			},
		},
		{
			hover: {
				decoration: {
					background: desk.UIColor["@red"].brighten(-0.2),
					borderColor: desk.UIColor["@red"].brighten(-0.2),
				},
			},
			pressed: {
				decoration: {
					background: desk.UIColor["@red"].brighten(0.2),
					borderColor: desk.UIColor["@red"].brighten(0.2),
				},
			},
		},
	),
};

const app = desk.useWebContext();
const view = desk.UICell.with(
	desk.UICenterRow.with(
		desk.UIPrimaryButton.with({
			label: "Delete",
			style: styles.dangerousButton,
		}),
	),
);
app.render(new view(), { mode: "page" });
