import { lazy, useState } from "react";
import { BrowserRouter as Router, Route, useParams, Routes, Navigate } from "react-router-dom";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { Helmet } from "react-helmet";
import { VscMenu } from "react-icons/vsc";
import Menu from "../Menu";
import Docs from "../Docs";
import Playground from "./Playground";
import humanizeRoute from "../utils/humanizeRoute";
import css from "./style.module.scss";

const requireExampleCode = require.context( "!!raw-loader!../examples", true, /index\.js$/ );
const requireExample = require.context( "../examples", true, /index\.js$/, "lazy" );
const keys = requireExample.keys();
const menuItems = keys.map( assetLink => assetLink.replace( /^\./, "/examples" ).replace( /\/index\.js$/, "" ) );

const LazyCache = {};

const getLazyComponent = exampleId => LazyCache[ exampleId ] || ( LazyCache[ exampleId ] = lazy(() => requireExample( exampleId ) ) );

const PlaygroundWrapper = () => {
    const route = useParams()[ "*" ];
    const exampleId = `./${route}/index.js`;
    return keys.includes( exampleId ) ? (
        <div className={css.playgroundWrapper}>
            <Helmet>
                <title>{humanizeRoute( route )} | af-virtual-scroll | Examples</title>
            </Helmet>
            <h2>Examples | {humanizeRoute( route )}</h2>
            <Playground
                Example={getLazyComponent(exampleId)}
                code={requireExampleCode(exampleId)}
                className={css.playground}
            />
        </div>
    ) : (
        <Navigate to="list/simple" />
    );
};

const BurgerWrapper = () => {
    const [ opened, setOpened ] = useState( false );

    return (
        <>
            <Helmet>
                <html lang="en" />
            </Helmet>
            <VscMenu className={css.burger} onClick={() => setOpened( !opened )} />
            <Menu
                items={menuItems}
                className={opened ? css.menu : css.hiddenMenu}
                onClick={() => setOpened( false )}   
            />
        </>
    );
}

const App = () => (
    <DndProvider backend={HTML5Backend}>
        <Router>
            <div className={css.wrapper}>
                <BurgerWrapper />
                <Routes>
                    <Route path="examples/*" element={<PlaygroundWrapper />} />
                    <Route path="docs/:docPage" element={<Docs className={css.docs} />} />
                    <Route path="*" element={<Navigate to="docs/why" />} />
                </Routes>
            </div>
        </Router>
    </DndProvider>
);

export default App;