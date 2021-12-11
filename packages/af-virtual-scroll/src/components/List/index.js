import { memo } from "react";
import PropTypes from "prop-types";

import useSubscription from "hooks/useSubscription";
import Container from "../common/Container";

import css from "./style.module.scss";

const ListRows = ({ model, renderRow }) => useSubscription( model, ({ from, to }) => {
    const result = [];

    for( let i = from; i < to; i++ ){
        result.push(renderRow( i ));
    }

    const fromOffset = model.getOffset(from);
    const toOffset = model.getOffset(to);
    const height = toOffset - fromOffset;

    return (
        <div
            className={css.wrapper}
            style={{
                transform: `translateY(${fromOffset}px)`,
                height
            }}
        >
            <div ref={model.setZeroChildNode} hidden />
            {result}
        </div>
    )
});

const List = ({ children, ...props }) => (
    <Container {...props}>
        {model => <ListRows model={model} renderRow={children} />}
    </Container>
);

List.propTypes = {
    /**
     * @param {number} rowIndex
     * @returns {any} one row element child. Fragments are not supported.
     */
    children: PropTypes.func.isRequired
}

export default memo( List );