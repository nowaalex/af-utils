import css from "./style.module.scss";

const SIZES = [
    [ "only List",           "4.72 KB", "2.07 KB" ],
    [ "only Table",          "6.19 KB", "2.63 KB" ],
    [ "List + Table",        "6.33 KB", "2.67 KB" ]
];

const BundleSize = () => (
    <>
        <h2>Bundle Size</h2>
        <p>
            This library was carefully optimized for tree-shaking, so final size depends on imports you use.
        </p>
        <table>
            <thead>
                <tr>
                    <th></th>
                    <th>Min</th>
                    <th>Min + gzipped</th>
                </tr>
            </thead>
            <tbody>
                {SIZES.map(( row, i ) => (
                    <tr key={i}>
                        {row.map( cell => (
                            <td key={cell}>{cell}</td>
                        ))}
                    </tr>
                ))}
                <tr>
                    <td colSpan={3}><div className={css.cssWarn}>+ 1.2 KB style.css</div></td>
                </tr>
            </tbody>
        </table>
    </>
);

export default BundleSize;