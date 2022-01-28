import Subscription from "components/Subscription";
import mapVisibleRange from "utils/mapVisibleRange";
import cx from "utils/cx";
import "style/style.scss";

const VerticalList = ({ model, children: renderRow, className, ...props }) => (
    <div className={cx("afvscr-list",className)} ref={model.setOuterNode} {...props}>
        <Subscription model={model}>
            {({ from, scrollSize }) => {
                const fromOffset = model.getOffset(from);

                return (
                    <div
                        style={{
                            marginTop: fromOffset,
                            height: scrollSize - fromOffset
                        }}
                    >
                        <div ref={model.setZeroChildNode} hidden />
                        {mapVisibleRange( model, renderRow )}
                    </div>
                );
            }}
        </Subscription>
    </div>
);

export default VerticalList;