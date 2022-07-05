import { VscMenu, VscClose } from "react-icons/vsc";
import Menu from "/components/Menu";
import Link from "next/link";

const Virtual = ({ children }) => (
    <div className="h-screen flex flex-col md:flex-row prose-zinc max-w-full">
        <details className="md:hidden ds-menu z-10 relative">
            <summary className="list-none flex-none border-b flex h-[50px] items-center px-4 gap-4">
                <VscMenu data-opener size="28px" className="cursor-pointer" />
                <VscClose data-closer size="28px" className="cursor-pointer" />
                <h2>
                    <Link href="/">
                        <a>@af-utils</a>
                    </Link>
                    /virtual
                </h2>
            </summary>
            <Menu className="overflow-auto fixed inset-0 top-[51px]" />
        </details>
        <Menu className="overflow-y-scroll min-w-[20em] hidden md:block h-screen flex-none shadow-xl">
            <h2>
                <Link href="/">
                    <a>@af-utils</a>
                </Link>
                /virtual
            </h2>
        </Menu>
        {children}
    </div>
);

export default Virtual;
