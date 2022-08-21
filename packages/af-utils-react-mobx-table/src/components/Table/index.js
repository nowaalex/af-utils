import { memo, useMemo, useRef, useLayoutEffect } from "react";
import { observer, Observer } from "mobx-react-lite";
import { autorun } from "mobx";
import RowsAggregator from "models/aggregators/Mobx";
import { useVirtualModel } from "@af-utils/react-virtual-headless";

import { Table, DefaultTableComponents } from "@af-utils/react-table";
import ColumnModel from "models/ColumnModel";
import HeaderLabel from "./HeaderLabel";
import HeaderInput from "./HeaderInput";
import GroupCell from "./GroupCell";
import SummaryCell from "./SummaryCell";
import GroupsPanel from "./GroupsPanel";
import GroupLabelDefault from "./GroupLabel";
import { css, cx } from "@af-utils/styled";

const flexAutoClass = css("flex: 1 1 auto");

const wrapperClass = cx(
    css("display: flex", "flex-flow: column nowrap", flexAutoClass)
);

const GroupRow = memo(({ i, groupI, m, model, data: D }) => (
    <D.components.Tr ref={el => model.el(i, el)}>
        <D.components.Td colSpan={D.columns.length}>
            <GroupCell m={m} i={groupI} columns={D.columns} />
        </D.components.Td>
    </D.components.Tr>
));

const useOnce = cb => (useRef().current ||= cb());

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

        virtualModel.set({ itemCount: model.finalIndexesCount });

        return model;
    });

    useLayoutEffect(
        () =>
            autorun(() =>
                virtualModel.set({
                    itemCount: aggregatorModel.finalIndexesCount,
                    estimatedItemSize
                })
            ),
        [estimatedItemSize]
    );

    useLayoutEffect(() => {
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

        const Row = observer(({ i, model, data: D }) => {
            const realRowIndex = aggregatorModel.finalIndexes[i];

            return realRowIndex < 0 ? (
                <GroupRow
                    i={i}
                    m={aggregatorModel}
                    groupI={realRowIndex}
                    data={D}
                    model={model}
                />
            ) : (
                <D.components.PASSED_ROW
                    i={realRowIndex}
                    i2={i}
                    data={D}
                    model={model}
                />
            );
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
                        className={flexAutoClass}
                        model={virtualModel}
                        ColumnModel={ColumnModel}
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
