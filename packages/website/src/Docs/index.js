import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import List from "./List";
import Table from "./Table";
import ComplexTable from "./ComplexTable";
import BundleSize from "./BundleSize";
import Why from "./Why";
import humanizeRoute from "../utils/humanizeRoute";

const Pages = {
    why: Why,
    list: List,
    table: Table,
    complexTable: ComplexTable,
    bundleSize: BundleSize
};

const Docs = ({ className }) => {

    const { docPage } = useParams();
    const Component = Pages[ docPage ];
    
    return (
        <div className={className}>
            <Helmet>
                <title>{Component ? humanizeRoute( docPage ) : "Not found"} | Docs | af-virtual-scroll</title>
            </Helmet>
            {Component ? <Component /> : "Doc page not found"}
        </div>
    )
}

export default Docs;