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
        <div className="not-prose grid grid-cols-1 xl:grid-cols-2 flex-1 gap-4 grow xl:basis-0 xl:overflow-hidden xl:contain-strict">
            <div className="overflow-hidden contain-strict xl:h-auto h-[40vh] grid">
                <Suspense fallback="Loading example...">
                    <C.Example />
                </Suspense>
            </div>
            <Suspense fallback="Loading example code...">
                <C.Code className="xl:overflow-auto p-4 text-sm" />
            </Suspense>
        </div>
    </div>
);

export default Example;
