import { useState, useRef, useCallback } from "react";
import faker from "faker";
import { List } from "af-virtual-scroll";

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

    const rangeEndMoveHandler = useCallback( async ({ rowsQuantity, endIndex }) => {
        if( isLoadingRef.current === false && rowsQuantity === endIndex ){
            isLoadingRef.current = true;
            const images = await fetchArrayOfImages();
            setPosts( p => p.concat( images ) );
            isLoadingRef.current = false;
        }
    }, []);

    return (
        <List rowsQuantity={posts.length} onRangeEndMove={rangeEndMoveHandler}>
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