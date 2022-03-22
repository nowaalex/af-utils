import prettyBytes from "pretty-bytes";
import * as styledSizes from "@af-utils/styled/lib/bundlesize.index.js";
import * as headlessSizes from "@af-utils/react-virtual-headless/lib/bundlesize.index.js";
import * as listSizes from "@af-utils/react-virtual-list/lib/bundlesize.index.js";
import * as tableSizes from "@af-utils/react-table/lib/bundlesize.index.js";
import * as mobxTableSizes from "@af-utils/react-mobx-table/lib/bundlesize.index.js";

const sizeColumns = [
    "raw",
    "min",
    "minGz",
    "minBrotli"
];

const rows = [
    [ styledSizes, "@af-utils/styled" ],
    [ headlessSizes, "@af-utils/react-virtual-headless" ],
    [ listSizes, "@af-utils/react-virtual-list" ],
    [ tableSizes, "@af-utils/react-table" ],
    [ mobxTableSizes, "@af-utils/react-mobx-table" ],
]

const SizesTable = () => (
    <table>
        <thead>
            <tr>
                <th>Library</th>
                {sizeColumns.map( col => <th key={col}>{col}</th>)}
            </tr>
        </thead>
        <tbody>
            {rows.map(([ sizes, name ], i ) => (
                <tr key={i}>
                    <td>{name}</td>
                    {sizeColumns.map( col => <td key={col}>{prettyBytes(sizes[ col ])}</td> )}
                </tr>
            ))}
        </tbody>
    </table>
);

export default SizesTable;