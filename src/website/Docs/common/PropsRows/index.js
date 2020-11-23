import { PROPS_ORDER } from "../constants";
import { FaCheck as RequiredIcon } from "react-icons/fa";

const Renderers = {
    required: v => v ? <RequiredIcon /> : null
}

const defaultRenderer = v => v;

const PropsRows = ({ propsList, span }) => propsList.map(( prop, i ) => (
    <tr key={prop.name}>
        {PROPS_ORDER.map( propName => prop[ propName ] === null ? null : (
            <td key={propName} rowSpan={propName === "description" && prop.span||""}>
                {( Renderers[propName] || defaultRenderer )( prop[propName] )}
            </td>
        ))}
    </tr>
));

export default PropsRows;