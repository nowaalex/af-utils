import PropsTable from "../common/PropsTable";
import PropsRows from "../common/PropsRows";
import commonProps from "../common/props";
import Code from "../../Code";
import Styling from "../common/Styling";
import codeString from "!!raw-loader!af-virtual-scroll/src/components/Table/renderers.js";

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
        name: "Row",
        type: "React element",
        description: "See renderers implementation"
    },
    {
        name: "renderHeaderCells",
        type: "function",
        description: null
    },
    {
        name: "renderTfootContent",
        type: "function",
        description: null
    },
    {
        name: "Cell",
        type: "elementType",
        description: null
    },
    {
        name: "renderRow",
        type: "function",
        description: null
    },
    {
        name: "getRowProps",
        type: "function",
        description: "returns object of tr props or undefined. This callback is executed every Row rerender, so hooks also can be called inside."
    },
    {
        name: "headless",
        type: "bool",
        defaultValue: "false",
        description: "Should render thead or not"
    }
];

const List = () => (
    <>
        <Styling />
        <h2>PropTypes</h2>
        <PropsTable>
            <PropsRows propsList={props} />
            <PropsRows propsList={commonProps} />
        </PropsTable>
        <h2>Renderers implementation</h2>
        <Code>
            {codeString}
        </Code>
    </>
);

export default List;