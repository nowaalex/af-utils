import Image from "next/image";
import imgSrc from "./messy.jpg";
import List from "components/examples/react-examples/list/simple/code";

const IndexExample = () => (
    <div className="grid md:grid-cols-2 gap-8 not-prose max-w-screen-xl">
        <Image priority alt="messy" src={imgSrc} />
        <div className="overflow-hidden contain-strict grid md:h-full h-64">
            <List />
        </div>
    </div>
);

export default IndexExample;
