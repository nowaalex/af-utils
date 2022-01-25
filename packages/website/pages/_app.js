import { MDXProvider } from '@mdx-js/react'
import Menu from "/components/Menu";
import Code from "/components/Code";

import "/styles/globals.css";
import "/styles/code.css";
import "af-virtual-scroll/lib/style.css";
import "af-react-table/lib/style.css";

const components = {
  inlineCode: Code,
}

const MyApp = ({ Component, pageProps }) => (
  <MDXProvider components={components}>
    <div className="max-h-screen flex">
      <Menu />
      <Component {...pageProps} />
    </div>
  </MDXProvider>

);

export default MyApp
