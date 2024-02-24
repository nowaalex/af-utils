"use server";

import kebabCase from "lodash/kebabCase";
import startCase from "lodash/startCase";

import type { MenuItem } from "components/Menu";
import type { Metadata } from "next";

export type Params = { params: { example: string[] } };

function walkMenu( obj: Record<string, any> | null, arr: MenuItem[], path: string ){
    if (obj) {
        for (const k in obj) {
            const kebabbed = kebabCase(k);
            const newPath = `${path}/${kebabbed}`;
            arr.push({
                name: startCase(k),
                path: newPath,
                children: walkMenu(obj[k], [], newPath)
            });
        }
    }
    return arr;
};

export async function getProjectExamples( projectName: string ){

    const glob = await import( "fast-glob" );

    return glob.default.sync(`../examples/src/${projectName}/**/src/code.tsx`)
        .map(f => f.split("/").slice(3, -2) );
};

export async function getMenuMapForProjectExamples( projectName: string ){
    const examples = await getProjectExamples( projectName );

    return walkMenu( examples.reduce<Record<string, any>>(
        (result, path) => (
            path.with( 0, "examples" ).reduce((acc, v) => (acc[v] ||= {}), result),
            result
        ),
        {}
    ), [], "/" + projectName );
};

export const getStaticParamsGenerator = ( projectName: string ) => async function(){
    const examples = await getProjectExamples( projectName );
    return examples.map( example => ({ example: example.slice( 1 ) }));
};

export const getMetadataGenerator = ( projectName: string ) => async function({ params }: Params ){

    const startCase = await import( "lodash/startCase" );

    const title = `${startCase.default(params.example.toReversed().join(" "))} Example`;

    let description = "";

    try {
        const descriptionModule = await import(
            `@af-utils/examples/src/${projectName}/${params.example.join("/")}/meta.ts`
        );

        description = descriptionModule?.default?.description;
    }
    catch( e ) {
        description = "Missing example";
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description
        }
    } satisfies Metadata;

};