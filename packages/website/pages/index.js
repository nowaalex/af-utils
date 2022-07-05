import Link from "next/link";
import CommonHead from "/components/CommonHead";

const Landing = () => (
    <div className="prose-xl prose prose-zinc prose-a:text-blue-700 prose-a:underline p-[5vmin] max-w-full bg-sloth h-screen w-screen bg-right-bottom bg-[length:80vmin] bg-no-repeat">
        <CommonHead />
        <h1>@af-utils/*</h1>
        <i>Simple tools that just work</i>
        <ul>
            <li>
                <Link href="/virtual">
                    <a>Virtual</a>
                </Link>
            </li>
        </ul>
    </div>
);

export default Landing;
