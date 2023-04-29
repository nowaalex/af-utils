const shiki = require("shiki");

function highlight(content, map, meta) {
    const callback = this.async();
    shiki
        .getHighlighter({
            theme: "one-dark-pro"
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

				const Code = props => createElement( "pre", {
					...props,
					style: {
						...props.style,
						background: "${highlighter.getBackgroundColor("one-dark-pro")}"
					},
					tabIndex: props.tabIndex || 0,
					dangerouslySetInnerHTML: { __html: ${JSON.stringify(str)} }
				});

				export default Code`,
                map,
                meta
            );
        });
}

module.exports = highlight;
