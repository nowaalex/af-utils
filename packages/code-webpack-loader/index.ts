import shiki from "shiki";
import type { LoaderDefinitionFunction } from "webpack";

const theme = "one-dark-pro";

const highlight: LoaderDefinitionFunction = function (content, map, meta) {
    const callback = this.async();
    shiki
        .getHighlighter({
            theme
        })
        .then(highlighter => {
            const tokens = highlighter.codeToThemedTokens(content, "tsx");
            const str = shiki.renderToHtml(tokens, {
                elements: {
                    pre({ children }) {
                        return children;
                    }
                }
            });

            callback(
                null,
                `import { createElement } from "react";

                const dangerouslySetInnerHTML = { __html: ${JSON.stringify(
                    str
                )} };

				const Code = props => createElement( "pre", {
					...props,
					style: {
						...props.style,
						background: "${highlighter.getBackgroundColor(theme)}"
					},
					tabIndex: props.tabIndex || 0,
					dangerouslySetInnerHTML
				});

				export default Code`,
                map,
                meta
            );
        });
};

export default highlight;
