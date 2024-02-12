"use client";

import startCase from "lodash/startCase";
import { usePathname } from "next/navigation";
import { ComponentPropsWithoutRef } from "react";
import {
    SiStackblitz as StackBlitz,
    SiGithub as Github,
    SiCodesandbox as CodeSandbox
} from "react-icons/si";

const A = (props: ComponentPropsWithoutRef<"a">) => (
    <a
        {...props}
        className="flex items-center gap-1"
        target="_blank"
        rel="noreferrer"
    />
);

const ExampleHeader = () => {
    const segments = usePathname()
        .replace("examples", "example")
        .split("/")
        .slice(2);

    const startCasedSegments = segments.map(startCase);

    const pathPiece = segments.slice(1).join("/");
    const gitPiece = `nowaalex/af-utils/tree/master/examples/src/virtual/react/${pathPiece}`;

    return (
        <div className="flex flex-wrap gap-x-10 gap-y-4 items-center mb-6">
            <h1 className="mb-0">
                {startCasedSegments[0]}: {startCasedSegments[2]} (
                {startCasedSegments[1]})
            </h1>
            <div className="flex gap-6 items-center font-medium">
                <A href={`https://github.com/${gitPiece}`}>
                    <Github />
                    Github
                </A>
                <A href={`https://codesandbox.io/s/github/${gitPiece}`}>
                    <CodeSandbox />
                    CodeSandbox
                </A>
                <A href={`https://stackblitz.com/github/${gitPiece}`}>
                    <StackBlitz />
                    StackBlitz
                </A>
            </div>
        </div>
    );
};

export default ExampleHeader;
