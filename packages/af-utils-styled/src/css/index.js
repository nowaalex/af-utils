const PREFIX = "af-styled_";
const RuleToClass = new Map();

const styleEl = process.env.__IS_SERVER__
    ? null
    : document.createElement("style");

if (!process.env.__IS_SERVER__) {
    if (process.env.NODE_ENV !== "production") {
        styleEl.setAttribute("data-af-styled", "");
    }
    document.head.append(styleEl);
}

const sheet = process.env.__IS_SERVER__ ? null : styleEl.sheet;

const getClassNameFromRule = rawRule => {
    const rule = rawRule
        .trim()
        .replace(/(\s)+/g, "$1")
        .replace(/\s?:\s?/, ":");

    let classForRule = RuleToClass.get(rule);

    if (!classForRule) {
        classForRule = PREFIX + rule.replace(/\W+/g, "_");
        RuleToClass.set(rule, classForRule);

        if (!process.env.__IS_SERVER__) {
            sheet.insertRule(`.${classForRule}{${rule}}`);
        }
    }

    return classForRule;
};

function css(firstRule) {
    let result = getClassNameFromRule(firstRule);

    for (let j = 1; j < arguments.length; j++) {
        result += " " + getClassNameFromRule(arguments[j]);
    }

    return result;
}

export default css;
