import { useState, useRef } from "react";
import faker from "faker";
import { VerticalList, useVirtual, useSubscription } from "af-virtual-scroll";

const fetchArrayOfImages = () => new Promise( resolve => setTimeout(
    resolve,
    200,
    Array.from({ length: 5 }, () => [
        faker.image.image(),
        faker.lorem.paragraphs()
    ])
));

const Posts = () => {

    const [ posts, setPosts ] = useState([]);

    const isLoadingRef = useRef( false );

    const model = useVirtual({
        itemCount: posts.length
    });

    useSubscription( model, async () => {
        const { itemCount, to } = model;
        if( isLoadingRef.current === false && itemCount === to ){
            isLoadingRef.current = true;
            const images = await fetchArrayOfImages();
            setPosts( p => p.concat( images ) );
            isLoadingRef.current = false;
        }
    });

    return (
        <VerticalList model={model}>
            {i => (
                <div key={i}>
                    <img src={posts[i][0]} />
                    <p>{posts[i][1]}</p>
                </div>
            )}
        </VerticalList>
    );
}

export default Posts;