import Readme from "../../../README.md";
import { VscGithub } from "react-icons/vsc";
import { SiDiscord } from "react-icons/si";

const IndexPage = () => (
    <div className="h-screen w-screen flex flex-col prose prose-xl">
        <header className="flex gap-8 p-6 justify-center prose-a:no-underline">
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
        <hr className="mx-[5vmin] my-0" />
        <main className="py-12 pl-[5vmin] flex-auto prose-a:text-blue-700 bg-no-repeat bg-right-bottom bg-[length:36vmax] sm:bg-sloth 2xl:bg-contain">
            <Readme />
        </main>
        <hr className="mx-[5vmin] my-0" />
        <footer className="text-center p-6 text-base">
            © {new Date().getFullYear()} Alex Fomin
        </footer>
    </div>
);

export default IndexPage;
