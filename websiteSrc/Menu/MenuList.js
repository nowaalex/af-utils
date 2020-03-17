import React, { memo } from "react";
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

const MenuList = ({ Component = "div", name, children, hIndex, ...props }) => {

    const NameComponent = `h${hIndex}`;

    return (
        <Component css={ulWrapperCss} {...props}>
            { name ? <NameComponent>{name}</NameComponent> : null }
            <ul>
                {children.map(( r, i ) => (
                    <li key={i}>
                        {r.children ? (
                            <MenuList {...r} hIndex={hIndex+1} />
                        ) : r.path.startsWith( "/" ) ? (
                            <NavLink to={r.path}>
                                {startCase(r.name)}
                            </NavLink>
                        ) : (
                            <a href={r.path} target="_blank">
                                {r.name}
                            </a>
                        )}
                    </li>
                ))}
            </ul>
        </Component>
    );
};

export default memo( MenuList );