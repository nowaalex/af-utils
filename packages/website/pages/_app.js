import Menu from "/components/Menu";

import "/styles/globals.css";
import "/styles/code.css";

const MyApp = ({ Component, pageProps }) => (
    <div className="max-h-screen flex">
      <Menu />
      <Component {...pageProps} />
    </div>
);

export default MyApp
