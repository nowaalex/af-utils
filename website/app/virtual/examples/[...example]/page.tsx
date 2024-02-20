import { getMetadataGenerator, getStaticParamsGenerator } from "utils/examples";
import getExamplePage from "components/layouts/ExamplePage";

export const dynamicParams = false;

export const generateStaticParams = getStaticParamsGenerator("virtual");
export const generateMetadata = getMetadataGenerator("virtual");

export default getExamplePage("virtual");
