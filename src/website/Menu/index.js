import { Link } from "react-router-dom";
import css from "./style.module.scss";

const Menu = ({ items }) => (
    <div className={css.wrapper}>
        {items.map( item => <Link to={item} key={item}>{item}</Link> )}
    </div>
);

export default Menu