import { useState  } from "react";
import Link from "next/link";
import cx from "classnames";
import { useRouter } from "next/router";
import { VscGithub } from "react-icons/vsc";
import { ImNpm } from "react-icons/im";
import { VscMenu } from "react-icons/vsc";
import { components } from "/AllExamples";
import humanizeRoute from "/utils/humanizeRoute";

const DOCS_STRUCTURE = [
    [ "Getting started", "/docs/why" ],
    [ "API reference", "/docs/apiReference" ],
    [ "ComplexTable", "/docs/complexTable" ],
    // [ "Bundle Size", "/docs/bundleSize" ]
];

const Menu = ({ className, ...props }) => {

    const { asPath } = useRouter();
    const [ opened, setOpened ] = useState( true );

    return (
        <>
            <button className="outline-none fixed top-1 left-3 z-20 block md:hidden" onClick={() => setOpened( !opened )}>
                <VscMenu className="h-8 w-8" />
            </button>
            
            <aside onClick={() => setOpened( false)} className={cx("z-10 overflow-auto grow-0 shrink-0 pt-8 bg-neutral-100 fixed inset-0 mr-0 md:mr-6 md:block md:pt-0 md:static",opened || "hidden",className)} {...props}>

                <h2 className="text-xl font-bold pl-3 mt-3">Docs</h2>

                <nav className="flex flex-col">
                    {DOCS_STRUCTURE.map(([ label, url ]) => (
                        <Link key={url} href={url}>
                            <a className="px-6 py-1">
                                {label}
                            </a>
                        </Link>
                    ))}
                </nav>
            
                <h2 className="text-xl font-bold mt-2 pl-3 mt-6">Examples</h2>

                <nav className="flex flex-col">
                    {components.map( item => (
                        <Link href={item} key={item}>
                            <a className={cx("px-6 py-1", item === asPath ? "bg-neutral-300" : "")}>{humanizeRoute(item)}</a>
                        </Link>
                    ))}
                </nav>
            
                <h2 className="text-xl font-bold pl-3 mt-3">Links</h2>

                <div className="flex flex-col mt-2 ml-6">
                    <a href="https://github.com/nowaalex/af-virtual-scroll" target="_blank" className="flex items-center py-1">
                        <VscGithub className="mr-2 self-stretch w-auto h-auto" />
                        Github
                    </a>
                    <a href="https://www.npmjs.com/package/af-virtual-scroll" target="_blank" className="flex items-center py-1">
                        <ImNpm className="mr-2 self-stretch w-auto h-auto" />
                        Npm
                    </a>
                </div>
            </aside>
        </>
    );
}

export default Menu;