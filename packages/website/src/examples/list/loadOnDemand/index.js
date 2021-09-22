import { useState, useRef } from "react";
import faker from "faker";
import { List, useRange } from "af-virtual-scroll";

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
    const modelRef = useRef();

    useRange( modelRef, async ({ rowsQuantity, to }) => {
        if( isLoadingRef.current === false && rowsQuantity === to ){
            isLoadingRef.current = true;
            const images = await fetchArrayOfImages();
            setPosts( p => p.concat( images ) );
            isLoadingRef.current = false;
        }
    });

    return (
        <List dataRef={modelRef} rowsQuantity={posts.length}>
            {i => (
                <div key={i}>
                    <img src={posts[i][0]} />
                    <p>{posts[i][1]}</p>
                </div>
            )}
        </List>
    );
}

export default Posts;