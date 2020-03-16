import React from "react";
import startCase from "lodash/startCase";
import { css } from "@emotion/core";
import { NavLink } from "react-router-dom";

const ulWrapperCss = css`
    a {
        text-decoration: none;
        color: inherit;

        &:hover {
            text-decoration: underline;
        }

        &.active {
            color: darkgreen;
            font-weight: bold;
        }
    }

    ul {
        list-style-type: none;
        padding-inline-start: 1.5em;
    }
`;

const MenuList = ({ name, children, className, hIndex }) => {

    const NameComponent = `h${hIndex}`;

    return (
        <div css={ulWrapperCss} className={className}>
            { name ? <NameComponent>{name}</NameComponent> : null }
            <ul>
                {children.map(( r, i ) => (
                    <li key={i}>
                        {r.children ? (
                            <MenuList {...r} hIndex={hIndex+1} />
                        ) : (
                            <NavLink to={r.path}>{startCase(r.name)}</NavLink>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default MenuList;