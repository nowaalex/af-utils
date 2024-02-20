import { ReactNode } from "react";
import Menu, { MenuItem } from "components/Menu";

const getDocumentationLayout =
    (
        items: readonly MenuItem[] | MenuItem[],
        prefix: string,
        productName: string
    ) =>
    ({ children }: { children: ReactNode }) => (
        <div className="h-screen w-screen flex flex-col lg:flex-row">
            <Menu items={items} prefix={prefix} productName={productName} />
            <main className="h-full flex-1 overflow-auto p-4 prose bg-white">
                {children}
            </main>
        </div>
    );

export default getDocumentationLayout;
