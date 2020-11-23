import { PROPS_ORDER } from "../constants";

const PropsTable = ({ children }) => (
    <table>
        <thead>
            <tr>
                {PROPS_ORDER.map( propName => (
                    <th key={propName}>
                        {propName}
                    </th>
                ))}
            </tr>
        </thead>
        <tbody>
            {children}
        </tbody>
    </table>   
);

export default PropsTable;