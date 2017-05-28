import * as React from "react";
import * as PropTypes from "prop-types";
import ThemeType from "../styles/ThemeType";

export interface DataProps {
  initialFocusIndex?: number;
  canSwipe?: boolean;
  autoSwipe?: boolean;
  speed?: number;
  easy?: number;
  delay?: number;
  direction?: "vertical" | "horizontal";
  transitionTimingFunction?: string;
  iconSize?: number;
  showIcon?: boolean;
  animate?: "slide" | "opacity";
  supportPC?: boolean;
  onChangeSwipe?: (index?: number) => void;
}

export interface SwipeProps extends DataProps, React.HTMLAttributes<HTMLDivElement> {}

export interface SwipeState {
  stopSwipe?: boolean;
  focusIndex?: number;
  childrenLength?: number;
  isHorizontal?: boolean;
  isSingleChildren?: boolean;
  haveAnimate?: boolean;
  swiping?: boolean;
}
const emptyFunc = () => {};
export default class Swipe extends React.Component<SwipeProps, SwipeState> {
  static defaultProps: SwipeProps = {
    direction: "horizontal",
    autoSwipe: true,
    className: "",
    animate: "slide",
    transitionTimingFunction: "ease-in-out",
    initialFocusIndex: 0,
    canSwipe: true,
    speed: 1500,
    delay: 5000,
    easy: 0.85,
    supportPC: false,
    onChangeSwipe: emptyFunc
  };

  static contextTypes = { theme: PropTypes.object };
  context: { theme: ThemeType };

  isSingleChildren = React.Children.count(this.props.children) === 1;

  state: SwipeState = {
    isSingleChildren: this.isSingleChildren,
    focusIndex: this.isSingleChildren ? this.props.initialFocusIndex : this.props.initialFocusIndex + 1,
    stopSwipe: false,
    childrenLength: 0,
    haveAnimate: false,
    swiping: false
  };

  private timeoutId: any;
  refs: {
    container: HTMLDivElement;
    content: HTMLDivElement;
  };
  private containerDOM: HTMLDivElement;
  private startClientX: number;
  private startClientY: number;
  private endClientX: number;
  private endClientY: number;
  originBodyStyle = { ...document.body.style };

  componentDidMount() {
    this.containerDOM = this.refs.container;
    this.updateState(this.props);
  }

  componentWillReceiveProps(nextProps: SwipeProps) {
    this.updateState(nextProps);
  }

  componentWillUnmount() {
    clearTimeout(this.timeoutId);
  }

  updateState = (props: SwipeProps) => {
    clearTimeout(this.timeoutId);
    const childrenLength = React.Children.count(props.children);
    const isSingleChildren = childrenLength === 1;
    this.setState({
      isHorizontal: props.direction === "horizontal",
      childrenLength,
      isSingleChildren,
      stopSwipe: !props.autoSwipe
    });
    if (props.autoSwipe && !isSingleChildren) {
      this.timeoutId = setTimeout(() => {
        this.swipeForward();
        this.setNextSlider();
      }, props.delay);
      this.setNextSlider.funStartTime = Date.now();
    }
  }

  setNextSlider: {
    (): void;
    funStartTime?: number;
  } = () => {
    const { delay } = this.props;
    if (this.state.stopSwipe || (this.setNextSlider.funStartTime && Date.now() - this.setNextSlider.funStartTime < delay)) return;
    this.timeoutId = setTimeout(() => {
      if (!this.state.stopSwipe) this.swipeForward();
      this.setNextSlider();
    }, delay);
    this.setNextSlider.funStartTime = Date.now();
  }

  getFocusIndex = () => this.state.focusIndex;

  swipeToIndex = (focusIndex: number) => {
    clearTimeout(this.timeoutId);
    focusIndex = focusIndex + 1;
    this.setState({
      haveAnimate: true,
      focusIndex: this.setRightFocusIndex(focusIndex),
      stopSwipe: true
    });
  }

  swipeForward = () => {
    const { focusIndex, swiping, isSingleChildren } = this.state;
    if (swiping || !this.props.autoSwipe) return;
    if (!isSingleChildren) this.props.onChangeSwipe(focusIndex);
    this.state.swiping = true;
    const isLast = focusIndex === this.getItemsLength() - 2;

    if (isLast) {
      this.setState({
        focusIndex: this.setRightFocusIndex(focusIndex + 1),
        haveAnimate: true
      }, () => {
        setTimeout(() => {
          this.setState({
            focusIndex: 1,
            haveAnimate: false
          });
          this.state.swiping = false;
        }, this.props.speed);
      });
    } else {
      this.setState({
        focusIndex: this.setRightFocusIndex(focusIndex + 1),
        haveAnimate: true
      });
      setTimeout(() => {
        this.state.swiping = false;
      }, this.props.speed);
    }
  }

  swipeBackWord = () => {
    const { focusIndex, swiping, isSingleChildren } = this.state;
    if (swiping || !this.props.autoSwipe) return;
    if (!isSingleChildren) this.props.onChangeSwipe(focusIndex);
    this.state.swiping = true;
    const isFirst = focusIndex === 1;

    if (isFirst) {
      this.setState({
        focusIndex: this.setRightFocusIndex(focusIndex - 1),
        haveAnimate: true
      }, () => {
        setTimeout(() => {
          this.setState({
            focusIndex: this.getItemsLength() - 2,
            haveAnimate: false
          });
          this.state.swiping = false;
        }, this.props.speed);
      });
    } else {
      this.setState({
        focusIndex: this.setRightFocusIndex(focusIndex - 1),
        haveAnimate: true
      });
      setTimeout(() => {
        this.state.swiping = false;
      }, this.props.speed);
    }
  }

  getItemsLength = () => {
    const { children } = this.props;
    const childrenSize = React.Children.toArray(children).length;
    return childrenSize > 1 ? childrenSize + 2 : childrenSize;
  }

  setRightFocusIndex = (focusIndex: number): number => {
    const length = this.getItemsLength();
    return focusIndex < 0 ? length - Math.abs(focusIndex) % length : focusIndex % length;
  }

  checkIsToucheEvent = (e: React.SyntheticEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => "changedTouches" in e;

  mouseOrTouchDownHandler = (e: any) => {
    Object.assign(document.body.style, {
      userSelect: "none",
      msUserSelect: "none",
      webkitUserSelect: "none"
    });
    this.endClientX = void 0;
    this.endClientY = void 0;
    const { isHorizontal } = this.state;
    this.setState({ stopSwipe: true });
    const isToucheEvent = this.checkIsToucheEvent(e);
    if (!isToucheEvent && !this.props.supportPC) return;
    if (isToucheEvent) {
      window.addEventListener("touchmove", this.mouseOrTouchMoveHandler);
      window.addEventListener("touchend", this.mouseOrTouchUpHandler);
    } else {
      window.addEventListener("mousemove", this.mouseOrTouchMoveHandler);
      window.addEventListener("mouseup", this.mouseOrTouchUpHandler);
    }
    const { childrenLength } = this.state;
    if (isToucheEvent) {
      if (isHorizontal) {
        this.startClientX = e.changedTouches[0].clientX;
      } else {
        this.startClientY = e.changedTouches[0].clientY;
      }
    } else {
      if (isHorizontal) {
        this.startClientX = e.clientX;
      } else {
        this.startClientY = e.clientY;
      }
    }
    this.refs.content.style.webkitTransition = "all 0.06125s 0s linear";
  }

  mouseOrTouchMoveHandler = (e: any) => {
    Object.assign(document.body.style, {
      userSelect: void 0,
      msUserSelect: void 0,
      webkitUserSelect: void 0,
      ...this.originBodyStyle
    });
    const isToucheEvent = this.checkIsToucheEvent(e);
    const { childrenLength, focusIndex, isHorizontal } = this.state;
    if (isToucheEvent) {
      if (isHorizontal) {
        this.endClientX = e.changedTouches[0].clientX;
      } else {
        this.endClientY = e.changedTouches[0].clientY;
      }
    } else {
      if (isHorizontal) {
        this.endClientX = e.clientX;
      } else {
        this.endClientY = e.clientY;
      }
    }
    this.refs.content.style.webkitTransform = `translate${isHorizontal ? "X" : "Y"}(${this.refs.container.getBoundingClientRect()[isHorizontal ? "width" : "height"] * (-focusIndex) - this[isHorizontal ? "startClientX" : "startClientY"] + this[isHorizontal ? "endClientX" : "endClientY"]}px)`;
  }

  mouseOrTouchUpHandler = (e: any) => {
    Object.assign(document.body.style, {
      userSelect: void 0,
      msUserSelect: void 0,
      webkitUserSelect: void 0,
      cursor: void 0,
      ...this.originBodyStyle
    });
    const { childrenLength, isHorizontal } = this.state;
    const { transitionTimingFunction, speed } = this.props;
    const isToucheEvent = this.checkIsToucheEvent(e);
    if (isToucheEvent) {
      window.removeEventListener("touchmove", this.mouseOrTouchMoveHandler);
      window.removeEventListener("touchend", this.mouseOrTouchUpHandler);
    } else {
      window.removeEventListener("mousemove", this.mouseOrTouchMoveHandler);
      window.removeEventListener("mouseup", this.mouseOrTouchUpHandler);
    }

    if ((isHorizontal && this.endClientX === void 0) || (
      !isHorizontal && this.endClientY === void 0
    )) {
      return;
    }
    const transition = `all ${speed}ms 0s ${transitionTimingFunction}`;
    this.refs.content.style.webkitTransition = transition;
    this.state.stopSwipe = false;
    let { easy } = this.props;
    if (easy < 0) easy = 0;
    if (easy > 1) easy = 1;

    const movePosition = this.endClientX - this.startClientX;
    const isNext = movePosition < 0;
    let focusIndex = this.state.focusIndex + movePosition / this.refs.container.getBoundingClientRect().width;
    focusIndex = isNext ? Math.ceil(focusIndex + easy / 2) : Math.floor(focusIndex - easy / 2);
    focusIndex = this.setRightFocusIndex(focusIndex);
    if (focusIndex === this.state.focusIndex) {
      this.refs.content.style.webkitTransform = `translateX(${this.refs.container.getBoundingClientRect().width * (-focusIndex / childrenLength) - this.startClientX + this.endClientX}px)`;
    } else {
      if (isNext) {
        this.swipeForward();
      } else {
        this.swipeBackWord();
      }
    }
    if (this.props.autoSwipe && !this.state.isSingleChildren && 0) {
      this.setNextSlider();
    }
  }

  render() {
    const {
      children,
      initialFocusIndex,
      showIcon,
      animate,
      canSwipe,
      autoSwipe,
      speed,
      delay,
      easy,
      direction,
      style,
      transitionTimingFunction,
      iconSize,
      supportPC,
      onChangeSwipe,
      ...attributes
    } = this.props;
    const {
      focusIndex,
      stopSwipe,
      childrenLength,
      isSingleChildren
    } = this.state;
    const { theme } = this.context;
    const styles = getStyles(this);
    const childrenArray = React.Children.toArray(children);
    const childrenSize = childrenArray.length;
    if (childrenSize > 1) {
      childrenArray.push(childrenArray[0]);
      childrenArray.unshift(childrenArray[childrenSize - 1]);
    }

    return (
      <div
        {...attributes}
        ref="container"
        style={styles.root}
      >
        <div
          onMouseDown={
            canSwipe && !isSingleChildren ? this.mouseOrTouchDownHandler : void 0
          }
          onTouchStart={
            canSwipe && !isSingleChildren ? this.mouseOrTouchDownHandler : void 0
          }
          ref="content"
          style={styles.content}
        >
          {childrenArray.map((child, index) => (
            <div data-index={index} style={styles.item} key={`${index}`}>
              {child}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

function getStyles(swipe: Swipe): {
  root?: React.CSSProperties;
  content?: React.CSSProperties;
  item?: React.CSSProperties;
} {
  const { transitionTimingFunction, speed, style } = swipe.props;
  const transition = `transform ${speed}ms 0s ${transitionTimingFunction}`;
  const {
    focusIndex,
    childrenLength,
    isHorizontal,
    isSingleChildren,
    haveAnimate
  } = swipe.state;
  const { theme: { prepareStyles } } = swipe.context;

  return {
    root: prepareStyles({
      display: "flex",
      flexDirection: isHorizontal ? "row" : "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      width: "100%",
      height: "auto",
      overflow: "hidden",
      flex: "0 0 auto",
      ...style
    }),
    content: prepareStyles({
      flex: "0 0 auto",
      display: "flex",
      flexDirection: isHorizontal ? "row" : "column",
      flexWrap: "nowrap",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      height: isHorizontal ? "100%" : `${childrenLength * 100}%`,
      width: isHorizontal ? `${childrenLength * 100}%` : "100%",
      transform: `translate${isHorizontal ? "X" : "Y"}(${-focusIndex * 100 / childrenLength}%)`,
      left: (isHorizontal && !isSingleChildren) ? `${((isSingleChildren ? 0 : 2 + childrenLength) / 2 - 0.5) * 100}%` : void 0,
      top: isHorizontal ? void 0 : `${((isSingleChildren ? 0 : 2 + childrenLength) / 2 - 0.5) * 100}%`,
      transition: haveAnimate ? transition : void 0
    }),
    item: prepareStyles({
      position: "relative",
      overflow: "hidden",
      width: isHorizontal ? `${100 / childrenLength}%` : "100%",
      height: isHorizontal ? "100%" : `${100 / childrenLength}%`,
      flex: "0 0 auto",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      userSelect: "none",
      userDrag: "none",
      WebkitUserDrag: "none"
    })
  };
}