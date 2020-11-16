import { NavLink } from "react-router-dom";
import css from "./style.module.scss";

const Menu = ({ items }) => (
    <nav className={css.wrapper}>
        {items.map( item => (
            <NavLink activeClassName={css.activeLink} className={css.link} to={item} key={item}>
                {item}
            </NavLink>
        ))}
    </nav>
);

export default Menu