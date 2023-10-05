import type { ElementType, ReactNode } from "react";

const Example =
    (CodeComponent: ElementType, DescriptionComponent?: ElementType) =>
    ({ children }: { children: ReactNode }) => (
        <div className="flex flex-col h-full grow gap-4">
            {DescriptionComponent && <DescriptionComponent />}
            <div className="grid grid-cols-1 xl:grid-cols-2 flex-1 gap-4 grow basis-0 overflow-hidden contain-strict">
                <div className="overflow-hidden contain-strict not-prose xl:h-auto h-[40vh] grid">
                    {children}
                </div>
                <CodeComponent className="xl:overflow-auto p-4 text-sm" />
            </div>
        </div>
    );

export default Example;
