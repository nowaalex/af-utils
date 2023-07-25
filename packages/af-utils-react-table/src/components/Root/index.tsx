import { useMemo, memo, useSyncExternalStore } from "react";
import DEFAULT_COMPONENTS_MAP from "components";
import Table from "models/Table";
import type Column from "models/Columns/Column";
import type Cell from "models/Rows/Row/Cell";

/*
    Todo:
        * think about border-collapse offsetHeight issue ( maybe throw border-collapse )
*/

type TableProps = {
    model: Table;
    components: object;
};

const Rows = ({
    model,
    components: C
}: {
    model: Table;
    components: typeof DEFAULT_COMPONENTS_MAP;
}) => {
    useSyncExternalStore(model.rows.on, () => model.rows.list);
    useSyncExternalStore(model.columns.on, () => model.columns.hash);

    return model.rows.list.map(row => (
        <C.Tr key={row.index}>
            {model.columns.map(col => {
                const cell = row.cells.get(col);

                if (cell) {
                    return (
                        <C.Td key={col.key}>
                            <BodyCell cell={cell} />
                        </C.Td>
                    );
                }

                throw new Error("Hmm");
            })}
        </C.Tr>
    ));
};

const HeaderColumn = ({
    column,
    components: C
}: {
    column: Column;
    components: typeof DEFAULT_COMPONENTS_MAP;
}) => {
    useSyncExternalStore(column.on, () => column.label);

    return column.label;
};

const BodyCell = ({ cell }: { cell: Cell }) => {
    useSyncExternalStore(cell.on, () => cell.value);

    return cell.value;
};

const Columns = ({
    model,
    components: C
}: {
    model: Table;
    components: typeof DEFAULT_COMPONENTS_MAP;
}) => {
    useSyncExternalStore(model.columns.on, () => model.columns.hash);

    return model.columns.map(col => (
        <C.Td key={col.key}>
            <HeaderColumn column={col} components={C} />
        </C.Td>
    ));
};

const Root = ({ model, components }: TableProps) => {
    const C = useMemo(
        () => ({ ...DEFAULT_COMPONENTS_MAP, ...components }),
        [components]
    );

    console.log({ model });

    return (
        <C.Table>
            <C.Thead>
                <C.Tr>
                    <Columns model={model} components={C} />
                </C.Tr>
            </C.Thead>

            <C.Tbody>
                <Rows model={model} components={C} />
            </C.Tbody>
        </C.Table>
    );
};

export default memo(Root);
