import { getMetadataGenerator, getStaticParamsGenerator } from "utils/examples";
import getExamplePage from "components/layouts/ExamplePage";

export const dynamicParams = false;

export const generateStaticParams =
    getStaticParamsGenerator("scrollend-polyfill");

export const generateMetadata = getMetadataGenerator("scrollend-polyfill");

export default getExamplePage("scrollend-polyfill");
