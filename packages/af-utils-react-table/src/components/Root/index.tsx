import {
    useMemo,
    memo,
    useSyncExternalStore,
    useLayoutEffect,
    Fragment
} from "react";
import DEFAULT_COMPONENTS_MAP from "components";
import Table from "models/Table";
import type Column from "models/Columns/Column";
import type Cell from "models/Rows/Row/Cell";
import type Row from "models/Rows/Row";
import type RowsGroup from "models/Rows/RowsGroup";

/*
    Todo:
        * think about border-collapse offsetHeight issue ( maybe throw border-collapse )
*/

type TableProps = {
    model: Table;
    components: object;
};

const rrr = (
    model: Table,
    C: typeof DEFAULT_COMPONENTS_MAP,
    child: Row | RowsGroup
) =>
    "key" in child ? (
        <C.Tr key={child.key}>
            {model.columns.map(col => {
                const cell = child.cells.get(col);

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
    ) : (
        <Fragment key={child.value}>
            <C.Tr>
                <C.Td colSpan={model.columns.length}>{child.value}</C.Td>
            </C.Tr>
            {child.children.map(v => rrr(model, C, v))}
        </Fragment>
    );

const Rows = ({
    model,
    components: C
}: {
    model: Table;
    components: typeof DEFAULT_COMPONENTS_MAP;
}) => {
    useSyncExternalStore(model.rows.on, () => model.rows.hash);
    useSyncExternalStore(model.columns.on, () => model.columns.hash);

    return rrr(model, C, model.rows.root);
};

const HeaderColumn = ({
    column,
    components: C
}: {
    column: Column;
    components: typeof DEFAULT_COMPONENTS_MAP;
}) => {
    useSyncExternalStore(column.on, () => column.label);

    return (
        <>
            {column.label}
            <button
                onClick={() => {
                    const gr = column.columns.table.rows.groupState;
                    const idx = gr.indexOf(column.key);
                    column.columns.table.rows.group(
                        idx !== -1 ? gr.toSpliced(idx, 1) : [...gr, column.key]
                    );
                }}
            >
                G
            </button>
        </>
    );
};

const BodyCell = ({ cell }: { cell: Cell }) => {
    useSyncExternalStore(cell.on, () => cell.value);

    useLayoutEffect(() => {
        cell.setRendered(true);
        return () => cell.setRendered(false);
    }, []);

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
