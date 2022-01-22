import { useState, useRef } from "react";
import { VerticalList, useVirtual, useRange } from "af-virtual-scroll";
import faker from "faker";

const fetchArrayOfImages = () => new Promise( resolve => setTimeout(
    resolve,
    200,
    Array.from({ length: 5 }, () => [
        faker.image.image(),
        faker.lorem.paragraphs()
    ])
));

const Posts = () => {

    const [ posts, setPosts ] = useState(() => [[
        faker.image.image(),
        faker.lorem.paragraphs()
    ]]);

    const isLoadingRef = useRef( false );

    const model = useVirtual({
        itemCount: posts.length
    });

    useRange( model, async ({ itemCount, to }) => {
        if( isLoadingRef.current === false && itemCount === to ){
            isLoadingRef.current = true;
            const images = await fetchArrayOfImages();
            isLoadingRef.current = false;
            setPosts( p => p.concat( images ) );
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