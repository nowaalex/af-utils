import Readme from "../../../README.md";
import { VscGithub } from "react-icons/vsc";
import { SiDiscord } from "react-icons/si";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "af-utils | Simple open-source tools that just work",
    description:
        "Simple and powerful tools that solve everyday problems (virtual scroll, scrollend polyfill, etc.) written in typescript"
};

const IndexPage = () => (
    <div className="h-screen w-screen flex flex-col gap-12">
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
        <main className="flex-auto prose prose-xl prose-zinc prose-a:text-blue-700 prose-a:underline px-[5vmin] sm:bg-sloth bg-right-bottom bg-[length:40vmax] 2xl:bg-contain bg-no-repeat">
            <Readme />
        </main>
        <footer className="text-center p-6 mx-[5vmin] border-t">
            © {new Date().getFullYear()} Alex Fomin
        </footer>
    </div>
);

export default IndexPage;
