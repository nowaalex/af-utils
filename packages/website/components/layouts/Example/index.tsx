import type { ElementType, ReactNode } from "react";

const Example =
    (CodeComponent: ElementType, DescriptionComponent?: ElementType) =>
    ({ children }: { children: ReactNode }) => (
        <div className="flex flex-wrap h-full grow gap-4 p-4">
            {DescriptionComponent && (
                <DescriptionComponent className="w-full" />
            )}
            <div className="contain-strict h-[70vh] basis-80 grow">
                {children}
            </div>
            <CodeComponent className="overflow-auto p-4 text-sm" />
        </div>
    );

export default Example;
