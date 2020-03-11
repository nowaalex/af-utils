import React, { Fragment } from "react";
import { css } from "@emotion/core";
import { NavLink } from "react-router-dom";
import { BrowserRouter as Router } from "react-router-dom"; 
import routes from "./routes";

const wrapperCss = css`
    display: flex;
    flex-flow: column nowrap;
`;

const sidePaneCss = css`

`;

const App = () => (
    <Router>
        <div css={wrapperCss}>
            <div>
                {routes.map(({ section, children }) => (
                    <Fragment key={section}>
                        <h2>{section}</h2>
                        <ul>
                            {children.map(({ name, path }) => (
                                <li key={path}>
                                    <NavLink to={path}>{name}</NavLink>
                                </li>
                            ))}
                        </ul>
                    </Fragment>
                ))}
            </div>
        </div>
    </Router>
);

export default App;