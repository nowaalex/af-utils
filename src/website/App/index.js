import { HashRouter as Router, Route, Switch } from "react-router-dom";
import Menu from "../Menu";
import Playground from "../Playground";
import css from "./style.module.scss";

const requireExampleCode = require.context( "!!raw-loader!../../examples", true, /index\.js$/ );
const requireExample = require.context( "../../examples", true, /index\.js$/ );
const keys = requireExample.keys();
const menuItems = keys.map( assetLink => assetLink.replace( /^\.\//, "/examples/" ) );

const renderPlayground = routeProps => {
    const exampleId = `./${routeProps.match.params.example}`;
    return keys.includes( exampleId ) ? (
        <Playground
            example={requireExample(exampleId)}
            code={requireExampleCode(exampleId)}
        />
    ) : null;
};

const App = () => (
    <Router>
        <div className={css.wrapper}>
            <Menu items={menuItems} />
            <Switch>
                <Route path="/examples/:example(.+)" render={renderPlayground} />
            </Switch>
        </div>
    </Router>
);

export default App;