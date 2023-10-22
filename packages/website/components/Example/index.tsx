import ExampleHeader from "./ExampleHeader";
import type dynamic from "next/dynamic";

type Components = {
    Example: ReturnType<typeof dynamic>;
    Description: ReturnType<typeof dynamic>;
    Code: ReturnType<typeof dynamic<{ className: string }>>;
};

const Example = ({ C }: { C: Components }) => (
    <div className="flex flex-col h-full">
        <div>
            <ExampleHeader />
            <C.Description />
        </div>
        <div className="not-prose grid grid-cols-1 xl:grid-cols-2 flex-1 gap-4 grow xl:basis-0 xl:overflow-hidden xl:contain-strict">
            <div className="overflow-hidden contain-strict xl:h-auto h-[40vh] grid">
                <C.Example />
            </div>
            <C.Code className="xl:overflow-auto p-4 text-sm" />
        </div>
    </div>
);

export default Example;
