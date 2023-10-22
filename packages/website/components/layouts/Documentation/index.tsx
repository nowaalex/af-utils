import { ReactNode } from "react";
import { VscMenu, VscClose } from "react-icons/vsc";
import Menu, { MenuItem } from "components/Menu";
import ClientMenu from "components/ClientMenu";
import Link from "next/link";
import { cx } from "@emotion/css";

const renderTopLink = (className: string, productName: string) => (
    <h1 className={cx("flex gap-2 font-medium", className)}>
        <Link href="/" prefetch={false} className="underline">
            af-utils
        </Link>
        /<span className="text-slate-500">{productName}</span>
    </h1>
);

const getDocumentationLayout =
    (
        items: readonly MenuItem[] | MenuItem[],
        prefix: string,
        productName: string
    ) =>
    ({ children }: { children: ReactNode }) => (
        <div className="h-screen w-screen flex flex-col lg:flex-row">
            <details className="lg:hidden ds-menu z-10 relative">
                <summary className="list-none max-w-none border-b flex h-[60px] items-center px-4 gap-8">
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
                    {renderTopLink("text-lg", productName)}
                </summary>
                <ClientMenu
                    items={items}
                    prefix={prefix}
                    className="overflow-auto p-34 fixed inset-0 top-[61px] bg-white"
                />
            </details>
            <aside className="shadow-lg hidden lg:flex h-screen overflow-y-scroll flex-none flex-col min-w-[20em]">
                <div className="sticky top-0 bg-white p-5 border-b">
                    {renderTopLink("text-xl", productName)}
                </div>
                <Menu items={items} prefix={prefix} className="p-4" />
            </aside>
            <main className="h-full flex-1 overflow-auto p-4">{children}</main>
        </div>
    );

export default getDocumentationLayout;