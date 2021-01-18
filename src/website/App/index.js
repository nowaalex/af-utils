import { lazy } from "react";
import { HashRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import Menu from "../Menu";
import Docs from "../Docs";
import Playground from "../Playground";
import css from "./style.module.scss";

const requireExampleCode = require.context( "!!raw-loader!../../examples", true, /index\.js$/ );
const requireExample = require.context( "../../examples", true, /index\.js$/, "lazy" );
const keys = requireExample.keys();
const menuItems = keys.map( assetLink => assetLink.replace( /^\./, "/examples" ).replace( /\/index\.js$/, "" ) );

const LazyCache = {};

const getLazyComponent = exampleId => LazyCache[ exampleId ] || ( LazyCache[ exampleId ] = lazy(() => requireExample( exampleId ) ) );

const renderPlayground = routeProps => {
    const exampleId = `./${routeProps.match.params.example}/index.js`;
    return keys.includes( exampleId ) ? (
        <Playground
            Example={getLazyComponent(exampleId)}
            code={requireExampleCode(exampleId)}
        />
    ) : (
        <Redirect to="/examples/list/simple" />
    );
};

const App = () => (
    <DndProvider backend={HTML5Backend}>
        <Router basename={process.env.BASE_URL}>
            <div className={css.wrapper}>
                <Menu items={menuItems} />
                <Switch>
                    <Route path="/examples/:example(.+)?" render={renderPlayground} />
                    <Route path="/docs/:docPage" component={Docs} />
                    <Redirect to="/examples" />
                </Switch>
            </div>
        </Router>
    </DndProvider>
);

export default App;