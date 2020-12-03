import { Fragment } from "react";
import css from "./style.module.scss";

const SIZES = [
    [ "only List",           "6.54 KB", "2.36 KB" ],
    [ "only Table",          "8.46 KB", "3.01 KB" ],
    [ "List + Table",   "9.21 KB", "3.19 KB" ]
];

const BundleSize = () => (
    <Fragment>
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
    </Fragment>
);

export default BundleSize;