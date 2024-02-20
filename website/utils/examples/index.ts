"use server";

import type { Metadata } from "next";

export type Params = { params: { example: string[] } };

export async function getProjectExamples( projectName: string ){

    const glob = await import( "fast-glob" );

    return glob.default.sync(`../examples/src/${projectName}/**/src/code.tsx`)
        .map(f => f.split("/").slice(3, -2) );
};

export async function getMenuMapForProjectExamples( projectName: string ){
    const examples = await getProjectExamples( projectName );

    return examples.reduce<Record<string, any>>(
        (result, path) => (
            path.with( 0, "examples" ).reduce((acc, v) => (acc[v] ||= {}), result),
            result
        ),
        {}
    );
};

export const getStaticParamsGenerator = ( projectName: string ) => async function(){
    const examples = await getProjectExamples( projectName );
    return examples.map( example => ({ example: example.slice( 1 ) }));
};

export const getMetadataGenerator = ( projectName: string ) => async function({ params }: Params ){

    const startCase = await import( "lodash/startCase" );

    const title = `${startCase.default(params.example.toReversed().join(" "))} Example`;

    const descriptionModule = await import(
        `@af-utils/examples/src/${projectName}/${params.example.join("/")}/meta.ts`
    );

    const description = descriptionModule?.default?.description;

    return {
        title,
        description,
        openGraph: {
            title,
            description
        }
    } satisfies Metadata;
};