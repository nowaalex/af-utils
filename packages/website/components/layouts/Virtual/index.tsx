import { ReactNode } from "react";
import { VscMenu, VscClose } from "react-icons/vsc";
import Menu from "components/Menu";
import ClientMenu from "components/ClientMenu";
import Link from "next/link";
import { cx } from "@emotion/css";
import glob from "fast-glob";

const renderTopLink = (className: string) => (
    <h1 className={cx("flex gap-2 font-medium", className)}>
        <Link href="/" prefetch={false} className="underline">
            af-utils
        </Link>
        /<span className="text-slate-500">virtual</span>
    </h1>
);

const Virtual = ({ children }: { children: ReactNode }) => {
    const map = glob
        .sync("./components/examples/react-examples/**/code.tsx")
        .reduce(
            (result, path) => (
                path
                    .replace(/^.+react-examples\//, "")
                    .replace(/\/code.+$/, "")
                    .split("/")
                    .reduce((acc, v) => (acc[v] ||= {}), result),
                result
            ),
            {} as Record<string, any>
        );

    return (
        <div className="h-screen w-screen flex flex-col lg:flex-row">
            <details className="lg:hidden ds-menu z-10 relative">
                <summary className="list-none max-w-full border-b flex h-[60px] items-center px-4 gap-8">
                    <VscMenu
                        data-opener
                        size="28px"
                        className="cursor-pointer"
                        aria-label="Open menu"
                        role="button"
                    />
                    <VscClose
                        data-closer
                        size="28px"
                        className="cursor-pointer"
                        aria-label="Close menu"
                        role="button"
                    />
                    {renderTopLink("text-lg")}
                </summary>
                <ClientMenu
                    map={map}
                    className="overflow-auto p-4 fixed inset-0 top-[61px] bg-white"
                />
            </details>
            <div className="shadow-lg hidden lg:flex h-screen overflow-y-scroll flex-none flex-col min-w-[20em]">
                <div className="sticky top-0 bg-white p-5 border-b">
                    {renderTopLink("text-xl")}
                </div>
                <Menu map={map} className="p-4" />
            </div>
            <main className="h-full flex-1 overflow-auto p-4">{children}</main>
        </div>
    );
};

export default Virtual;
