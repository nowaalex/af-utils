import { memo } from "react";
import useModelSubscription from "hooks/useModelSubscription";
import cx from "utils/cx";
import css from "./style.module.scss";

const BODY_TABLE_SUBSCRIPTIONS = [ "rowsQuantity", "normalizedVisibleColumns" ];

const BodyTable = ({ children, className }) => {

    const { rowsQuantity, normalizedVisibleColumns } = useModelSubscription( BODY_TABLE_SUBSCRIPTIONS );

    return (
        <table
            children={children}
            className={cx(css.wrapper,className)}
            aria-rowcount={rowsQuantity}
            aria-colcount={normalizedVisibleColumns.length}
        />
    );
};

export default memo( BodyTable );