import { ElementType } from "react";
import ExampleHeader from "./ExampleHeader";
import IframeWrapper from "components/IframeWrapper";

type Components = {
    Example: ElementType;
    Code: ElementType;
    Description: ElementType | null;
};

const Example = ({ C, iframe }: { C: Components; iframe: boolean }) => {
    const ExampleWrapper = iframe ? IframeWrapper : "div";

    return (
        <div className="flex flex-col h-full">
            <div>
                <ExampleHeader />
                {C.Description && <C.Description />}
            </div>
            <div className="not-prose grid grid-cols-1 xl:grid-cols-2 flex-1 gap-4 grow xl:basis-0 xl:overflow-hidden xl:contain-strict">
                <ExampleWrapper className="overflow-hidden contain-strict xl:h-full h-[40vh] w-full">
                    <div className="grid h-full w-full">
                        <C.Example />
                    </div>
                </ExampleWrapper>
                <C.Code className="overflow-x-auto xl:overflow-y-auto p-4 text-sm" />
            </div>
        </div>
    );
};
export default Example;
