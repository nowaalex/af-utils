import { ElementType, ReactNode } from "react";

const Example =
    (CodeComponent: ElementType) =>
    ({ children }: { children: ReactNode }) =>
        (
            <div className="flex h-full grow">
                <div className="contain-strict basis-80 grow">{children}</div>
                <CodeComponent className="overflow-auto p-4 text-sm" />
            </div>
        );

export default Example;
