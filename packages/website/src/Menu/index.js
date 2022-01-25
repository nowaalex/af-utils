import { NavLink } from "react-router-dom";
import { VscGithub } from "react-icons/vsc";
import { ImNpm } from "react-icons/im";
import humanizeRoute from "../utils/humanizeRoute";
import css from "./style.module.scss";

const DOCS_STRUCTURE = [
    [ "Getting started", "/docs/why" ],
    [ "API reference", "/apiReference" ],
    [ "ComplexTable", "/docs/complexTable" ],
    // [ "Bundle Size", "/docs/bundleSize" ]
];

const getClassName = ({ isActive }) => isActive ? css.activeLink : css.link;

const Menu = ({ items, className, ...props }) => (
    
    <aside className={className} {...props}>

        <h2>Docs</h2>
        <nav>
            {DOCS_STRUCTURE.map(([ label, url ]) => (
                <NavLink key={url} className={getClassName} to={url}>
                    {label}
                </NavLink>
            ))}
        </nav>
    
        <h2>Examples</h2>
        <nav>
            {items.map( item => (
                <NavLink className={getClassName} to={item} key={item}>
                    {humanizeRoute(item.replace( "/examples/", "" ))}
                </NavLink>
            ))}
        </nav>
    
        <h2>Links</h2>
        <a href="https://github.com/nowaalex/af-virtual-scroll" target="_blank" className={css.link}>
            <VscGithub />
            Github
        </a>
        <a href="https://www.npmjs.com/package/af-virtual-scroll" target="_blank" className={css.link}>
            <ImNpm />
            Npm
        </a>
    </aside>
);

export default Menu;