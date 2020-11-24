import { Fragment } from "react";
import PropsTable from "../common/PropsTable";
import PropsRows from "../common/PropsRows";
import commonProps from "../common/props";
import Styling from "../common/Styling";

const props = [
    {
        name: "children",
        required: true,
        type: "function",
        description: "Render prop. Takes one argument(row index) and returns one element"
    }
];

const List = () => (
    <Fragment>
        <Styling />
        <h2>PropTypes</h2>
        <PropsTable>
            <PropsRows propsList={props} />
            <PropsRows propsList={commonProps} />
        </PropsTable>
    </Fragment>
);

export default List;