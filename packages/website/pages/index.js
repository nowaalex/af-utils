/* eslint-disable react/jsx-no-target-blank */
import Link from "next/link";
import { VscGithub } from "react-icons/vsc";
import { SiDiscord } from "react-icons/si";
import CommonHead from "/components/CommonHead";

const Landing = () => (
    <div className="h-screen w-screen flex flex-col gap-12">
        <CommonHead />
        <header className="flex gap-8 mx-[5vmin] p-6 justify-center border-b flex-none text-lg">
            <a
                href="https://github.com/nowaalex/af-utils"
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 hover:underline"
            >
                <VscGithub size="1em" />
                Github
            </a>

            <a
                href="https://discord.gg/6uQZB2y4cz"
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 hover:underline"
            >
                <SiDiscord size="1em" />
                Discord
            </a>
        </header>
        <div className="flex-auto prose-xl prose prose-zinc prose-a:text-blue-700 prose-a:underline px-[5vmin] max-w-full sm:bg-sloth bg-right-bottom bg-[length:55vmin] xl:bg-contain bg-no-repeat">
            <h1>af-utils/*</h1>
            <i className="text-lg">
                Simple tools that just work&nbsp;<small>(usually fast)</small>
            </i>
            <ul className="max-w-[28em]">
                <li>
                    <Link href="/virtual">
                        <a>Virtual scroll</a>
                    </Link>{" "}
                    for rendering only visible part of huge lists, tables and
                    grids{" "}
                    <small>
                        <i>(currently available for React)</i>
                    </small>
                </li>
                <li>To be continued...</li>
            </ul>
        </div>
        <footer className="text-center p-6 mx-[5vmin] border-t">
            © {new Date().getFullYear()} Alex Fomin
        </footer>
    </div>
);

export default Landing;
