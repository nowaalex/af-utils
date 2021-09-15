import { lazy, useState, Fragment } from "react";
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
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

const renderPlayground = routeProps => {
    const route = routeProps.match.params.example;
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
        <Redirect to="/examples/list/simple" />
    );
};

const BurgerWrapper = () => {
    const [ opened, setOpened ] = useState( false );

    return (
        <Fragment>
            <VscMenu className={css.burger} onClick={() => setOpened( !opened )} />
            <Menu
                items={menuItems}
                className={opened ? css.menu : css.hiddenMenu}
                onClick={() => setOpened( false )}   
            />
        </Fragment>
    );
}

const App = () => (
    <DndProvider backend={HTML5Backend}>
        <Router>
            <div className={css.wrapper}>
                <BurgerWrapper />
                <Switch>
                    <Route path="/examples/:example(.+)?" render={renderPlayground} />
                    <Route path="/docs/:docPage" render={() => <Docs className={css.docs} />} />
                    <Redirect to="/docs/why" />
                </Switch>
            </div>
        </Router>
    </DndProvider>
);

export default App;