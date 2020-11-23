import { Fragment } from "react";
import PropsTable from "../common/PropsTable";
import PropsRows from "../common/PropsRows";
import commonProps from "../common/props";
import Code from "../../Code";
import codeString from "!!raw-loader!../../../../src/components/Table/renderers.js";

const props = [
    {
        name: "getRowData",
        type: "function",
        required: true,
        description: "Render prop. Takes one argument(row index) and returns one object(row)"
    },
    {
        name: "columns",
        type: "array",
        required: true,
    },
    {
        span: 5,
        name: "renderRow",
        type: "function",
        description: "See renderers implementation"
    },
    {
        name: "renderCell",
        type: "function",
        description: null
    },
    {
        name: "renderTheadContents",
        type: "function",
        description: null
    },
    {
        name: "CellsList",
        type: "elementType",
        description: null
    },
    {
        name: "Cell",
        type: "elementType",
        description: null
    },
    {
        name: "headless",
        type: "bool",
        defaultValue: "false",
        description: "Should render thead or not"
    }
];

const List = () => (
    <Fragment>
        <h2>PropTypes</h2>
        <PropsTable>
            <PropsRows propsList={props} />
            <PropsRows propsList={commonProps} />
        </PropsTable>
        <h2>Renderers implementation</h2>
        <Code>
            {codeString}
        </Code>
    </Fragment>
);

export default List;