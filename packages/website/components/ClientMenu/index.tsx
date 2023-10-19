"use client";

import Menu from "components/Menu";
import { ComponentPropsWithoutRef, MouseEvent } from "react";

const menuClickHandler = (e: MouseEvent) => {
    if (
        e.target instanceof HTMLAnchorElement &&
        e.target.getAttribute("href")?.startsWith("/")
    ) {
        e.currentTarget?.closest("details")?.removeAttribute("open");
    }
};

const ClientMenu = (props: ComponentPropsWithoutRef<typeof Menu>) => (
    <Menu {...props} onClick={menuClickHandler} />
);

export default ClientMenu;
