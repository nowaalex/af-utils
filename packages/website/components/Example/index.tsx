import { Suspense, type ElementType } from "react";
import ExampleHeader from "./ExampleHeader";

type Components = {
    Example: ElementType;
    Description: ElementType;
    Code: ElementType;
};

const Example = ({ C }: { C: Components }) => (
    <div className="flex flex-col h-full">
        <div>
            <ExampleHeader />
            <Suspense>
                <C.Description />
            </Suspense>
        </div>
        <Suspense>
            <div className="not-prose grid grid-cols-1 xl:grid-cols-2 flex-1 gap-4 grow xl:basis-0 xl:overflow-hidden xl:contain-strict">
                <div className="overflow-hidden contain-strict xl:h-auto h-[40vh] grid">
                    <C.Example />
                </div>
                <C.Code className="xl:overflow-auto p-4 text-sm" />
            </div>
        </Suspense>
    </div>
);

export default Example;
