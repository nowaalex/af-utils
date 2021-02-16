import { useState, useCallback } from "react";
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
    const [ isLoading, setLoading ] = useState( false );

    const rangeEndMoveHandler = useCallback( async ({ rowsQuantity, endIndex }) => {
        if( rowsQuantity === endIndex ){
            setLoading( true );
            const images = await fetchArrayOfImages();
            setPosts( p => p.concat( images ) );
            setLoading( false );
        }
    }, []);

    return (
        <List rowsQuantity={posts.length} onRangeEndMove={isLoading ? null : rangeEndMoveHandler}>
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