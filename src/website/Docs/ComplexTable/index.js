import { Fragment } from "react";

const ComplexTable = () => (
    <Fragment>
        <h2>Unstable!</h2>
        <div>
            <p>This component supports summary/filtering/grouping/sorting.</p>
            <ul>
                <li>It is not yet ready to be published as stable, because API is changed frequently</li>
                <li>It is not fully documented</li>
                <li>It depends on react-dnd, mobx and mobx-react-lite</li>
            </ul>
        </div>
    </Fragment>
);

export default ComplexTable;