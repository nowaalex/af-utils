import { ReactNode } from "react";
import Menu, { MenuItem } from "components/Menu";

const getDocumentationLayout = (
    getItems: () => Promise<MenuItem[]>,
    prefix: string,
    productName: string
) =>
    async function ({ children }: { children: ReactNode }) {
        const items = await getItems();

        return (
            <div className="h-screen w-screen flex flex-col lg:flex-row">
                <Menu items={items} prefix={prefix} productName={productName} />
                <main className="h-full flex-1 overflow-auto p-4 prose bg-white">
                    {children}
                </main>
            </div>
        );
    };

export default getDocumentationLayout;
