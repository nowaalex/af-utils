import { useEffect, memo, useMemo } from "react";
import { observer, Observer } from "mobx-react-lite";
import { autorun } from "mobx";
import RowsAggregator from "models/aggregators/Mobx";
import {
    useVirtualModel,
    areItemPropsEqual,
    useOnce
} from "@af-utils/react-virtual-headless";

import { Table, DefaultTableComponents } from "@af-utils/react-table";

import { EMPTY_ARRAY } from "constants";
import HeaderLabel from "./HeaderLabel";
import HeaderInput from "./HeaderInput";
import GroupCell from "./GroupCell";
import SummaryCell from "./SummaryCell";
import GroupsPanel from "./GroupsPanel";
import GroupLabelDefault from "./GroupLabel";
import { css, cx } from "@af-utils/styled";

const wrapperClass = css(
    "display: flex",
    "flex-flow: column nowrap",
    "flex: 1 1 auto"
);

const ComplexTable = ({
    itemCount,
    estimatedItemSize,
    overscanCount,
    estimatedWidgetSize,
    getRowData,
    getKey,
    getTotalsFormattingHelper,
    columns,
    GroupLabel = GroupLabelDefault,
    className,
    components: passedComponents,
    footer,
    ...props
}) => {
    const virtualModel = useVirtualModel({
        estimatedItemSize,
        estimatedWidgetSize,
        overscanCount
    });

    const aggregatorModel = useOnce(() => {
        const model = new RowsAggregator();

        model.merge({
            itemCount,
            getRowData,
            getTotalsFormattingHelper,
            columns
        });

        const initialGroupingKeys = model.visibleColumns
            .filter(
                col =>
                    typeof col.initialGroupingIndex === "number" &&
                    col.initialGroupingIndex > 0
            )
            .sort((a, b) => a.initialGroupingIndex - b.initialGroupingIndex)
            .map(col => col.key);

        model.setGrouping(initialGroupingKeys);

        virtualModel.setItemCount(model.finalIndexesCount);

        return model;
    });

    useEffect(
        () =>
            autorun(() =>
                virtualModel.setItemCount(aggregatorModel.finalIndexesCount)
            ),
        EMPTY_ARRAY
    );

    useEffect(() => {
        aggregatorModel.merge({
            itemCount,
            getRowData,
            getTotalsFormattingHelper,
            columns
        });
    });

    const PassedRow = passedComponents?.Row;

    const components = useMemo(() => {
        const PASSED_ROW = PassedRow || DefaultTableComponents.Row;

        const GroupRow = memo(
            ({ i, data: D }) => (
                <D.components.Tr>
                    <D.components.Td colSpan={D.columns.length}>
                        <GroupCell
                            m={aggregatorModel}
                            i={i}
                            columns={D.columns}
                        />
                    </D.components.Td>
                </D.components.Tr>
            ),
            areItemPropsEqual
        );

        const Row = observer(({ i, data }) => {
            const realRowIndex = aggregatorModel.finalIndexes[i];
            const Component =
                realRowIndex < 0 ? GroupRow : data.components.PASSED_ROW;

            return <Component key={i} i={realRowIndex} data={data} />;
        });

        const HeaderCell = ({ column, i }) => (
            <>
                <HeaderLabel m={aggregatorModel} column={column} i={i} />
                <HeaderInput m={aggregatorModel} column={column} i={i} />
            </>
        );

        const FooterCell = observer(({ column }) => (
            <SummaryCell
                m={aggregatorModel}
                column={column}
                rowIndexes={aggregatorModel.filteredIndexes}
            />
        ));

        return {
            ...passedComponents,
            PASSED_ROW,
            Row,
            HeaderCell,
            FooterCell
        };
    }, [PassedRow]);

    return (
        <div className={cx(wrapperClass, className)}>
            <GroupsPanel
                aggregatorModel={aggregatorModel}
                GroupLabel={GroupLabel}
            />
            <Observer>
                {() => (
                    <Table
                        model={virtualModel}
                        columns={aggregatorModel.visibleColumns}
                        getRowData={getRowData}
                        getKey={getKey}
                        components={components}
                        footer={aggregatorModel.hasTotals}
                        {...props}
                    />
                )}
            </Observer>
        </div>
    );
};

export default memo(ComplexTable);
