/* eslint-disable react/jsx-no-target-blank */
import Link from "next/link";
import { BiSad } from "react-icons/bi";
import { AiFillHome } from "react-icons/ai";
import CommonHead from "/components/CommonHead";

const Landing = () => (
    <div className="prose-2xl text-center p-8">
        <CommonHead title="Not found" />
        <h1 className="flex items-center justify-center gap-3">
            <BiSad />
            404
            <BiSad />
        </h1>

        <h2 className="text-2xl">Page was not found</h2>

        <Link href="/" className="flex flex-col items-center mt-12 underline">
            <AiFillHome size="4em" />
            Go home
        </Link>
    </div>
);

export default Landing;
