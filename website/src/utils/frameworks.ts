import {
    type ExampleFramework,
    exampleFrameworks,
    getExampleFrameworkDefinition
} from "@af-utils/examples/config";

export interface FrameworkPresentation {
    icon: string;
    iconClass?: string;
}

export const frameworkPresentation = Object.fromEntries(
    exampleFrameworks.map(framework => {
        const definition = getExampleFrameworkDefinition(framework);
        return [
            framework,
            {
                icon: definition.icon,
                ...("iconClass" in definition
                    ? { iconClass: definition.iconClass }
                    : {})
            }
        ];
    })
) as Record<ExampleFramework, FrameworkPresentation>;

export const virtualAdapterPackages = exampleFrameworks
    .map(framework => getExampleFrameworkDefinition(framework).adapterPackage)
    .filter(packageName => packageName !== "@af-utils/virtual-core");

export const getAdapterFramework = (packageName: string) =>
    exampleFrameworks.find(
        framework =>
            getExampleFrameworkDefinition(framework).adapterPackage ===
                packageName && packageName !== "@af-utils/virtual-core"
    );
