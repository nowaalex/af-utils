import Link from "next/link";
import { BiSad } from "react-icons/bi";
import { AiFillHome } from "react-icons/ai";

const NotFound = () => (
    <div className="prose prose-2xl p-8 text-center">
        <h1 className="flex items-center justify-center gap-3">
            <BiSad />
            404
            <BiSad />
        </h1>

        <h2 className="text-2xl">Page was not found</h2>

        <Link href="/" className="mt-12 flex flex-col items-center underline">
            <AiFillHome size="4em" />
            Go home
        </Link>
    </div>
);

export default NotFound;
