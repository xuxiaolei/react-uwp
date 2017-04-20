import * as React from "react";

import Icon from "../Icon";
import { ThemeType } from "../../styles/ThemeType";

const defaultProps: TreeViewProps = __DEV__ ? require("./devDefaultProps").default : {
	listItems: []
};

export interface List {
	titleNode?: string | React.ReactNode;
	expanded?: boolean;
	disable?: boolean;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	focus?: boolean;
	visited?: boolean;
	children?: List[];
}
export interface DataProps {
	listItems?: List[];
	iconDirection?: "left" | "right";
	listItemHeight?: number;
	childPadding?: number;
	iconPadding?: number;
	titleNodeStyle?: React.CSSProperties;
	onChangeList?: (listItems: List[]) => void;
	rootStyle?: React.CSSProperties;
	showFocus?: boolean;
}
export interface TreeViewProps extends DataProps, React.HTMLAttributes<HTMLDivElement> {}
export interface TreeViewState {
	currListItems?: List[];
	visitedList?: List;
	showFocus?: boolean;
}

export default class TreeView extends React.Component<TreeViewProps, TreeViewState> {
	static defaultProps: TreeViewProps = {
		...defaultProps,
		listItemHeight: 40,
		childPadding: 40,
		iconPadding: 10,
		iconDirection: "left",
		onChangeList: () => {},
		rootStyle: { width: 400 }
	};

	state: TreeViewState = {
		currListItems: this.props.listItems,
		visitedList: null,
		showFocus: this.props.showFocus
	};

	static contextTypes = { theme: React.PropTypes.object };
	context: { theme: ThemeType };

	componentWillReceiveProps(nexProps: TreeViewProps) {
		this.setState({
			currListItems: nexProps.listItems,
			showFocus: nexProps.showFocus
		});
	}

	handelClick = (e: React.MouseEvent<HTMLDivElement>, list: List) => {
		list.expanded = !list.expanded;
		if (this.state.visitedList && !list.children) {
			this.state.visitedList.visited = false;
		}
		list.visited = true;
		this.setState({
			visitedList: list.children ? this.state.visitedList : list,
			showFocus: false,
		});
		this.props.onChangeList(this.state.currListItems);
		// const { style } = e.currentTarget;
		// if (style.height !== "auto") {
		// 	style.height = "auto";
		// 	style.padding = "0 0";
		// } else {
		// 	style.height = "0";
		// 	style.padding = "2px 0";
		// }
	}

	renderTree = (): React.ReactNode => {
		const { currListItems, showFocus } = this.state;
		const { theme } = this.context;
		const { prepareStyles } = theme;
		const { iconDirection } = this.props;
		const isRight = iconDirection === "right";
		const styles = getStyles(this);
		const { childPadding, iconPadding } = this.props;
		const renderList = ((list: List, index: number, isChild?: boolean): React.ReactNode => {
			const { titleNode, expanded, disable, visited, focus, children } = list;
			const haveChild = Array.isArray(children) && children.length !== 0;
			const fadeAccent = theme[theme.themeName === "Dark" ? "accentDarker1" : "accentLighter1"];
			return (
				<div
					style={{
						paddingLeft: isChild ? (isRight ? 10 : childPadding) : void(0),
					}}
					key={`${index}`}
				>
					<div
						style={{
							cursor: disable ? "not-allowed" : "default",
							color: disable ? theme.baseLow : void(0),
							...styles.title,
						}}
						onMouseEnter={e => {
							if (focus && showFocus) return;
							const bgNode = e.currentTarget.querySelector(".react-uwp-tree-view-bg") as HTMLDivElement;
							bgNode.style.background = (haveChild || !visited) ? theme.baseLow : theme.accent;
						}}
						onMouseLeave={e => {
							if (focus && showFocus) return;
							const bgNode = e.currentTarget.querySelector(".react-uwp-tree-view-bg") as HTMLDivElement;
							bgNode.style.background = (haveChild || !visited) ? "none" : fadeAccent;
						}}
						onClick={disable ? void(0) : (e) => {
							if (focus && showFocus) return;
							if (list.onClick) list.onClick(e);
							this.handelClick(e, list);
						}}
					>
						<div className="react-uwp-tree-view-title" style={{ paddingLeft: haveChild ? iconPadding : 0, ...styles.titleNode }}>
							{titleNode}
						</div>
						<p>{haveChild && (
							<Icon
								style={prepareStyles({
									cursor: disable ? "not-allowed" : "pointer",
									color: disable ? theme.baseLow : void 0,
									width: isRight ? void 0 : 20,
									fontSize: 14,
									zIndex: 1,
									transform: `rotateZ(${expanded ? "-180deg" : (isRight ? "0deg" : "-90deg")})`,
								})}
							>
								{"\uE011"}
							</Icon>
						)}</p>
						<div
							style={prepareStyles({
								transition: "all 0.25s",
								zIndex: 0,
								background: (focus && showFocus && !haveChild) ? theme.accent : (
									(haveChild || !visited) ? "none" : fadeAccent
								),
								...styles.bg
							})}
							className="react-uwp-tree-view-bg"
						/>
					</div>
					{haveChild && (
						<div
							style={{
								height: expanded ? "auto" : 0,
								transition: "all .25s",
								display: expanded ? void 0 : "none",
								overflow: expanded ? void 0 : "hidden",
								...styles.parent
							}}
						>
							{expanded && children.map((list: List[], index) => renderList(list, index, true))}
						</div>
					)}
				</div>
			);
		});

		return currListItems.map((list, index) => renderList(list, index));
	}

	render() {
		// tslint:disable-next-line:no-unused-variable
		const { listItems, iconDirection, listItemHeight, onChangeList, rootStyle, titleNodeStyle, childPadding, iconPadding, showFocus, ...attributes } = this.props;
		const { currListItems } = this.state;
		const styles = getStyles(this);

		return (
			<div {...attributes} style={styles.root}>
				{currListItems ? this.renderTree() : null}
			</div>
		);
	}
}

function getStyles(treeView: TreeView): {
	root?: React.CSSProperties;
	title?: React.CSSProperties;
	titleNode?: React.CSSProperties;
	parent?: React.CSSProperties;
	icon?: React.CSSProperties;
	bg?: React.CSSProperties;
} {
	const { context, props: { iconDirection, listItemHeight, style, titleNodeStyle } } = treeView;
	const isRight = iconDirection === "right";
	const { theme } = context;
	const { prepareStyles } = theme;
	return {
		root: prepareStyles({
			fontSize: 14,
			overflowX: "hidden",
			overflowY: "auto",
			color: theme.baseMediumHigh,
			background: theme.altMediumHigh,
			padding: 20,
			...prepareStyles(style)
		}),
		title: prepareStyles({
			whiteSpace: "nowrap",
			textOverflow: "ellipsis",
			width: "100%",
			position: "relative",
			fontSize: 14,
			display: "flex",
			height: listItemHeight,
			flexDirection: `row${isRight ? "" : "-reverse"}` as any,
			alignItems: "center",
			justifyContent: isRight ? "space-between" : "flex-end",
			transition: "all .25s 0s ease-in-out"
		}),
		titleNode: prepareStyles({
			color: "inherit",
			zIndex: 1,
			width: "100%",
			overflow: "hidden",
			whiteSpace: "nowrap",
			textOverflow: "ellipsis",
			...titleNodeStyle
		}),
		parent: prepareStyles({
			transition: "all .25s 0s ease-in-out",
		}),
		bg: {
			position: "absolute",
			top: 0,
			left: "-100%",
			width: "400%",
			height: "100%"
		}
	};
}
