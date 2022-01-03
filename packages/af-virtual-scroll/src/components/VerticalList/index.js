import Subscription from "components/common/Subscription";
import mapVisibleRange from "utils/mapVisibleRange";
import cx from "utils/cx";

import css from "./style.module.scss";

const VerticalList = ({ model, children: renderRow, className, ...props }) => (
    <div className={cx(css.wrapper,className)} ref={model.setOuterNode} {...props}>
        <Subscription model={model}>
            {({ from, widgetScrollSize }) => {

                const fromOffset = model.getOffset(from);

                return (
                    <div
                        style={{
                            marginTop: fromOffset,
                            height: widgetScrollSize - fromOffset
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