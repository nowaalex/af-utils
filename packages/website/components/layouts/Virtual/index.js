import { useRef, memo } from "react";
import { VscMenu, VscClose } from "react-icons/vsc";
import Menu from "/components/Menu";
import Link from "next/link";

// layouts are rendered in unoptimal way
const Nav = memo(() => {
    const defailsRef = useRef();

    return (
        <>
            <details
                ref={defailsRef}
                className="md:hidden ds-menu z-10 relative"
            >
                <summary className="list-none flex-none border-b flex h-[60px] items-center px-4 gap-8">
                    <VscMenu
                        data-opener
                        size="28px"
                        className="cursor-pointer"
                    />
                    <VscClose
                        data-closer
                        size="28px"
                        className="cursor-pointer"
                    />
                    <h2 className="m-0 p-0">
                        <Link href="/">
                            <a>af-utils</a>
                        </Link>
                        &nbsp;/&nbsp;virtual
                    </h2>
                </summary>
                <Menu
                    className="overflow-auto p-4 fixed inset-0 top-[61px] bg-white"
                    onClick={e => {
                        if (e.target.getAttribute("href")?.startsWith("/")) {
                            defailsRef.current.removeAttribute("open");
                        }
                    }}
                />
            </details>
            <div className="shadow-lg hidden md:flex h-screen overflow-y-scroll flex-none flex-col min-w-[20em]">
                <div className="sticky top-0 bg-white p-5 border-b">
                    <h2 className="m-0 p-0">
                        <Link href="/">
                            <a>af-utils</a>
                        </Link>
                        &nbsp;/&nbsp;virtual
                    </h2>
                </div>

                <Menu className="p-4" />
            </div>
        </>
    );
});

const Virtual = ({ children }) => (
    <div className="h-screen flex flex-col md:flex-row prose prose-zinc max-w-full">
        <Nav />
        {children}
    </div>
);

export default Virtual;
