import { NavLink } from "react-router-dom";
import { VscGithub } from "react-icons/vsc";
import { ImNpm } from "react-icons/im";
import humanizeRoute from "../utils/humanizeRoute";
import css from "./style.module.scss";

const DOCS_STRUCTURE = [
    [ "Getting started", "/docs/why" ],
    [ "List", "/docs/list" ],
    [ "Table", "/docs/table" ],
    [ "ComplexTable", "/docs/complexTable" ],
    [ "Bundle Size", "/docs/bundleSize" ]
];

const Menu = ({ items }) => (
    
    <div className={css.wrapper}>

        <h2 className={css.header}>Docs</h2>
        <nav>
            {DOCS_STRUCTURE.map(([ label, url ]) => (
                <NavLink key={url} activeClassName={css.activeLink} className={css.link} to={url}>
                    {label}
                </NavLink>
            ))}
        </nav>
    
        <h2 className={css.header}>Examples</h2>
        <nav>
            {items.map( item => (
                <NavLink activeClassName={css.activeLink} className={css.link} to={item} key={item}>
                    {humanizeRoute(item.replace( "/examples/", "" ))}
                </NavLink>
            ))}
        </nav>

        
        <h2 className={css.header}>Links</h2>
        <a href="https://github.com/nowaalex/af-virtual-scroll" target="_blank" className={css.link}>
            <VscGithub />
            Github
        </a>
        <a href="https://www.npmjs.com/package/af-virtual-scroll" target="_blank" className={css.link}>
            <ImNpm />
            Npm
        </a>
    </div>
);

export default Menu