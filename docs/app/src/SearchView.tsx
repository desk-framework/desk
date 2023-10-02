import {
	bound,
	JSX,
	UICellStyle,
	UIColor,
	UIIconButtonStyle,
	UIIconResource,
	UITextFieldStyle,
	UITheme,
} from "@desk-framework/frame-core";

const TextFieldStyle = UITextFieldStyle.extend(
	{
		background: UIColor["@clear"],
		textColor: "inherit",
		padding: { y: 4 },
		borderColor: UIColor["@separator"],
		borderThickness: { bottom: 1 },
		borderRadius: 0,
		width: "100%",
	},
	{
		[UITheme.STATE_FOCUSED]: true,
		borderColor: UIColor["@primary"],
	},
);
const CloseButtonStyle = UIIconButtonStyle.extend(
	{
		background: UIColor["@clear"],
		textColor: "inherit",
	},
	{
		[UITheme.STATE_HOVERED]: true,
		[UITheme.STATE_DISABLED]: false,
		background: UIColor["@clear"],
		textColor: "inherit",
	},
);
const ResultCellStyle = UICellStyle.extend(
	{
		padding: { bottom: 8, x: 6 },
		borderThickness: 2,
		css: { cursor: "pointer" },
	},
	{
		[UITheme.STATE_HOVERED]: true,
		background: "var(--nav-hover-background)",
	},
	{
		[UITheme.STATE_FOCUSED]: true,
		borderColor: UIColor["@primary"],
		borderThickness: 2,
	},
);

export default (
	<cell
		cellStyle={{ shrink: 1 }}
		padding={{ start: 16 }}
		layout={{ distribution: "start" }}
	>
		<cell
			cellStyle={{
				height: 72,
				grow: 0,
				shrink: 0,
				padding: { start: 8, end: 12 },
			}}
		>
			<row>
				<textfield
					textFieldStyle={TextFieldStyle}
					requestFocus
					disableSpellCheck
					onInput="SearchInput"
					onArrowDownKeyPress="ArrowDownOnInput"
					onEnterKeyPress="GoToFirstResult"
				>
					Search...
				</textfield>
				<button
					buttonStyle={CloseButtonStyle}
					icon={UIIconResource["@close"]}
					iconColor="inherit"
					onClick="Close"
				/>
			</row>
		</cell>
		<cell
			hidden={bound.boolean("!hasInput").or("!loading")}
			padding={{ y: 32 }}
		>
			<label>Loading...</label>
		</cell>
		<scrollcontainer>
			<list items={bound.list("results")} maxItems={50} allowKeyboardFocus>
				<cell
					cellStyle={ResultCellStyle}
					layout={{ gravity: "start" }}
					allowFocus
					onClick="GoToResult"
					onEnterKeyPress="GoToResult"
					onArrowUpKeyPress="FocusPrevious"
					onArrowDownKeyPress="FocusNext"
				>
					<row>
						<label labelStyle={{ fontWeight: 500, shrink: 0 }}>
							{bound.string("item.title")}
						</label>
						<label labelStyle={{ opacity: 0.5 }}>
							{bound.string("item.showId")}
						</label>
					</row>
					<label labelStyle={{ padding: 0, fontSize: 14 }} htmlFormat>
						{bound.string("item.abstract")}
					</label>
				</cell>
			</list>
		</scrollcontainer>
	</cell>
);
