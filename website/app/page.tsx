import Readme from "../../README.md";
import { VscGithub } from "react-icons/vsc";
import { SiDiscord } from "react-icons/si";

const IndexPage = () => (
    <div className="h-screen w-screen flex flex-col prose">
        <header className="mx-[5vmin] border-b prose-lg flex gap-8 p-6 justify-center prose-a:no-underline">
            <a
                href={`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_SUFFIX}`}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 hover:underline"
            >
                <VscGithub />
                Github
            </a>
            <a
                href={process.env.NEXT_PUBLIC_DISCORD_LINK}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 hover:underline"
            >
                <SiDiscord />
                Discord
            </a>
        </header>
        <main className="py-12 px-[5vmin] lg:pr-0 flex-auto prose-xl prose-a:text-blue-700 bg-no-repeat bg-right-bottom bg-[length:40vmax] sm:bg-sizif 2xl:bg-contain">
            <Readme />
        </main>
        <footer className="mx-[5vmin] border-t text-center p-6">
            © {new Date().getFullYear()} Alex Fomin
        </footer>
    </div>
);

export default IndexPage;
