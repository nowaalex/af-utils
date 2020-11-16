import { HashRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import Menu from "../Menu";
import Docs from "../Docs";
import Playground from "../Playground";
import css from "./style.module.scss";

const requireExampleCode = require.context( "!!raw-loader!../../examples", true, /index\.js$/ );
const requireExample = require.context( "../../examples", true, /index\.js$/ );
const keys = requireExample.keys();
const menuItems = keys.map( assetLink => assetLink.replace( /^\./, "/examples" ).replace( /\/index\.js$/, "" ) );

const renderPlayground = routeProps => {
    const exampleId = `./${routeProps.match.params.example}/index.js`;
    return keys.includes( exampleId ) ? (
        <Playground
            example={requireExample(exampleId)}
            code={requireExampleCode(exampleId)}
        />
    ) : (
        <Redirect to="/examples/list/simple" />
    );
};

const App = () => (
    <Router>
        <div className={css.wrapper}>
            <Menu items={menuItems} />
            <Switch>
                <Route path="/examples/:example(.+)" render={renderPlayground} />
                <Route path="/docs/:docPage" component={Docs} />
                <Redirect to="/examples" />
            </Switch>
        </div>
    </Router>
);

export default App;