import { useParams } from "react-router-dom";
import Code from "../Code";
import commonPropTypes from "!!raw-loader!./../../components/common/propTypes.js";
import css from "./style.module.scss";

const Docs = () => {

    const { docPage } = useParams();

    if( docPage === "commonPropTypes" ){
        return (
            <Code className={css.wrapper}>
                {commonPropTypes}
            </Code>
        );
    }
    
    return null;
}

export default Docs;