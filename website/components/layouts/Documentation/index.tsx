import { ReactNode } from "react";
import Menu, { MenuItem } from "components/Menu";
import NextPrevBlock from "components/NextPrevBlock";

function flattenMenu(
    arr: MenuItem[] | readonly MenuItem[],
    resultArr: MenuItem[]
) {
    if (arr) {
        for (const k of arr) {
            if (k.children?.length) {
                flattenMenu(k.children, resultArr);
            } else {
                resultArr.push(k);
            }
        }
    }
    return resultArr;
}

const getDocumentationLayout = (
    getItems: () => Promise<MenuItem[]>,
    productName: string
) =>
    async function DocumentationLayout({ children }: { children: ReactNode }) {
        const items = await getItems();
        const flattenedItems = flattenMenu(items, []);

        return (
            <div className="flex h-screen w-screen flex-col lg:flex-row">
                <Menu items={items} productName={productName} />
                <div className="flex h-full flex-1 flex-col overflow-auto bg-white">
                    <main className="prose flex-1 p-4">{children}</main>
                    <nav className="mt-2 flex flex-none items-center justify-between gap-4 p-4 font-medium">
                        <NextPrevBlock items={flattenedItems} />
                    </nav>
                </div>
            </div>
        );
    };

export default getDocumentationLayout;
