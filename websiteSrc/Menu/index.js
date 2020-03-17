import React, { useState, useCallback, Fragment } from "react";
import { css } from "@emotion/core";
import MenuList from "./MenuList";
import { ExamplesMenu } from "../routes";

const MenuStruct = [
    {
        name: "Examples",
        children: ExamplesMenu
    },
    {
        name: "Misc",
        children: [
            {
                name: "Bundle analyzer",
                path: "/misc/bundle"
            }
        ]
    },
    {
        name: "Links",
        children: [
            {
                name: "Github",
                path: "https://github.com/nowaalex/af-virtual-scroll"
            },
            {
                name: "NPM",
                path: "https://www.npmjs.com/package/af-virtual-scroll"
            }
        ]
    }
];


const menuWrapperCss = css`
    padding: 0.5em 1em 0.5em 0;
    overflow: auto;
    flex: 0 0 auto;
    border-right: 2px solid rgb(30, 30, 30);
    background: #e3e3e3;

    @media(max-width: 900px){
        
        position: fixed;
        height: 100vh;
        width: 100vw;
        z-index: 100;
        font-size: 1.4em;
        transform: translateY(-100%);
        transition: transform 0.5s;

        &[data-mobile-expanded]{
            transform: translateY(0);
        }
    }
`;

const mobileBurgerMenu = css`
    display: none;
    padding: 0.5em;
    background: #e3e3e3;
    text-align: center;

    @media(max-width: 900px){
        display: initial;
    }
`;

const burgerCss = css`
    height: 21px;
    width: 21px;
    position: relative;
    border-style: solid none;
    border-width: 3px;
    border-color: #555;
    display: inline-block;
    box-sizing: border-box;
    &:after{
        position: absolute;
        border-style: solid none none;
        border-width: inherit;
        border-color: inherit;
        content: "";
        left: 0;
        right: 0;
        top: 6px;
    }
`;

const toggle = x => !x;

const Menu = ({ className }) => {

    const [ mobileExpanded, setMobileExpanded ] = useState( false );
    const hideMenu = useCallback(() => setMobileExpanded( false ), []);
    const toggleMenu = useCallback(() => setMobileExpanded( toggle ), []);

    return (
        <Fragment>
            <div css={mobileBurgerMenu} onClick={toggleMenu}>
                <div css={burgerCss} />
            </div>
            <MenuList
                css={menuWrapperCss}
                className={className}
                hIndex={1}
                Component="nav"
                data-mobile-expanded={mobileExpanded?"":undefined}
                onClick={hideMenu}
            >
                {MenuStruct}
            </MenuList>
        </Fragment>
    );
};

export default Menu;