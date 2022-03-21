import { useState, useRef, memo } from "react";

import {
    useVirtual,
    useSubscription,
    areIndexesEqual,
    EVT_TO,
    List
} from "@af/react-virtual-list";

import faker from "faker";

const fetchArrayOfImages = () => new Promise( resolve => setTimeout(
    resolve,
    200,
    Array.from({ length: 5 }, () => [
        faker.image.image(),
        faker.lorem.paragraphs()
    ])
));

const Item = memo(({ i, data: posts }) => (
    <div>
        <img src={posts[i][0]} />
        <p>{posts[i][1]}</p>
    </div>
), areIndexesEqual );

const Posts = () => {

    const [ posts, setPosts ] = useState(() => [[
        faker.image.image(),
        faker.lorem.paragraphs()
    ]]);

    const isLoadingRef = useRef( false );

    const model = useVirtual({
        itemCount: posts.length,
        estimatedItemSize: 500
    });

    useSubscription( model, async () => {
        const { itemCount, to } = model;
        if( isLoadingRef.current === false && itemCount === to ){
            isLoadingRef.current = true;
            const images = await fetchArrayOfImages();
            isLoadingRef.current = false;
            setPosts( p => p.concat( images ) );
        }
    }, [ EVT_TO ], true );
    
    return (
        <List model={model} itemData={posts}>
            {Item}
        </List>
    );
}

export default Posts;