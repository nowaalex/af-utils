import Readme from "../../README.md";
import { VscGithub } from "react-icons/vsc";
import { SiDiscord } from "react-icons/si";

const IndexPage = () => (
    <div className="prose flex h-screen w-screen flex-col">
        <header className="prose-lg prose-a:no-underline mx-[5vmin] flex justify-center gap-8 border-b p-6">
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
        <main className="prose-xl prose-a:text-blue-700 sm:bg-sizif flex-auto bg-[length:40vmax] bg-right-bottom bg-no-repeat px-[5vmin] py-12 lg:pr-0 2xl:bg-contain">
            <Readme />
        </main>
        <footer className="mx-[5vmin] border-t p-6 text-center">
            © {new Date().getFullYear()} Alex Fomin
        </footer>
    </div>
);

export default IndexPage;
