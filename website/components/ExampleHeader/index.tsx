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

const getHeader = (segments: string[]) => {
    switch (segments.length) {
        case 6:
            return `${segments[1]} ${segments[3]} Example: ${segments[5]} (${segments[4]})`;
        case 4:
            return `${segments[1]} Example: ${segments[3]}`;
        default:
            return "Example";
    }
};

const getGitPiece = (segments: string[]) => {
    if (segments.length > 2) {
        return `${process.env.NEXT_PUBLIC_GITHUB_SUFFIX}/tree/${process.env.NEXT_PUBLIC_GITHUB_BRANCH}/examples/src/${segments[1]}/${segments.slice(3).join("/")}`;
    }

    throw new Error("Wrong segments");
};

const ExampleHeader = () => {
    const segments = usePathname().split("/");
    const startCasedSegments = segments.map(startCase);
    const gitPiece = getGitPiece(segments);

    return (
        <div className="mb-6 flex flex-wrap items-center gap-x-10 gap-y-4">
            <h1 className="mb-0">{getHeader(startCasedSegments)}</h1>
            <div className="flex items-center gap-6 font-medium">
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
