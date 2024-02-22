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
    async function ({ children }: { children: ReactNode }) {
        const items = await getItems();
        const flattenedItems = flattenMenu(items, []);

        return (
            <div className="h-screen w-screen flex flex-col lg:flex-row">
                <Menu items={items} productName={productName} />
                <div className="h-full flex-1 flex flex-col overflow-auto bg-white">
                    <main className="flex-1 p-4 prose">{children}</main>
                    <nav className="p-4 mt-2 flex-none flex gap-4 justify-between font-medium items-center">
                        <NextPrevBlock items={flattenedItems} />
                    </nav>
                </div>
            </div>
        );
    };

export default getDocumentationLayout;
