import prettyBytes from "pretty-bytes";
import * as coreSizes from "@af-utils/virtual-core/lib/bundlesize.index.js";
import * as reactSizes from "@af-utils/virtual-react/lib/bundlesize.index.js";

const sizeColumns = ["raw", "min", "minGz", "minBrotli"] as const;

const rows = [
    [coreSizes, "@af-utils/virtual-core"],
    [reactSizes, "@af-utils/virtual-react"]
] as const;

const SizesTable = () => (
    <table>
        <thead>
            <tr>
                <th>Package</th>
                {sizeColumns.map(col => (
                    <th key={col}>{col}</th>
                ))}
            </tr>
        </thead>
        <tbody>
            {rows.map(([sizes, name], i) => (
                <tr key={i}>
                    <td>{name}</td>
                    {sizeColumns.map(col => (
                        <td key={col}>{prettyBytes(sizes[col])}</td>
                    ))}
                </tr>
            ))}
        </tbody>
    </table>
);

export default SizesTable;
