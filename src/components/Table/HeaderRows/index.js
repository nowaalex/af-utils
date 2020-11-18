import { memo } from "react";
import useModelSubscription from "hooks/useModelSubscription";

const HEADER_CELLS_SUBSCRIPTIONS = [ "normalizedVisibleColumns" ];

const HeaderRows = ({ renderTheadContents }) => (
    renderTheadContents( useModelSubscription( HEADER_CELLS_SUBSCRIPTIONS ).normalizedVisibleColumns )
);

export default memo( HeaderRows );