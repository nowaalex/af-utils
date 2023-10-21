import Link from "next/link";
import { BiSad } from "react-icons/bi";
import { AiFillHome } from "react-icons/ai";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Not found"
};

const NotFound = () => (
    <div className="prose prose-2xl text-center p-8">
        <h1 className="flex items-center justify-center gap-3">
            <BiSad />
            404
            <BiSad />
        </h1>

        <h2 className="text-2xl">Page was not found</h2>

        <Link
            href="/"
            prefetch={false}
            className="flex flex-col items-center mt-12 underline"
        >
            <AiFillHome size="4em" />
            Go home
        </Link>
    </div>
);

export default NotFound;
