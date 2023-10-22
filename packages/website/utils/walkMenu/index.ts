import kebabCase from "lodash/kebabCase";
import startCase from "lodash/startCase";
import type { MenuItem } from "components/Menu";

const walkMenuInner = (
    obj: Record<string, any> | null,
    arr: MenuItem[],
    path: string
) => {
    if (obj) {
        for (const k in obj) {
            const kebabbed = kebabCase(k);
            const newPath = `${path}/${kebabbed}`;
            arr.push({
                name: startCase(k),
                path: newPath,
                children: walkMenuInner(obj[k], [], newPath)
            });
        }
    }
    return arr;
};

const walkMenu = (obj: object) => walkMenuInner(obj, [], "");

export default walkMenu;
