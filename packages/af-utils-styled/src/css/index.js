const PREFIX = "af-s";
const RuleToClass = new Map();

let sheet;

if (typeof document !== "undefined") {
    const styleEl = document.createElement("style");
    if (process.env.NODE_ENV !== "production") {
        styleEl.setAttribute("data-af-styled", "");
    }
    document.head.append(styleEl);
    sheet = styleEl.sheet;
} else {
    sheet = { insertRule() {} };
}

let counter = 0;

const getClassNameFromRule = rawRule => {
    const rule = rawRule
        .trim()
        .replace(/(\s)+/g, "$1")
        .replace(/\s*:\s*/, ":");
    let classForRule = RuleToClass.get(rule);

    if (!classForRule) {
        classForRule = PREFIX + (counter++).toString(36);
        RuleToClass.set(rule, classForRule);
        sheet.insertRule(`.${classForRule}{${rule}}`);
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
