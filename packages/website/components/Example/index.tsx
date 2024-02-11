import { ElementType } from "react";
import ExampleHeader from "./ExampleHeader";
import StyledIframe from "./StyledIframe";

type Components = {
    Code: ElementType;
    src: string;
    Description: ElementType | null;
};

const Example = ({ C }: { C: Components }) => (
    <div className="flex flex-col h-full">
        <div>
            <ExampleHeader />
            {C.Description && <C.Description />}
        </div>
        <div className="not-prose grid grid-cols-1 xl:grid-cols-2 flex-1 gap-4 grow xl:basis-0 xl:overflow-hidden xl:contain-strict">
            <StyledIframe className="xl:h-full h-[40vh] w-full" src={C.src} />
            <C.Code className="overflow-x-auto xl:overflow-y-auto p-4 text-sm" />
        </div>
    </div>
);

export default Example;
