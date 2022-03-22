function cx(className) {
    for (let i = 1, c = ""; i < arguments.length; i++) {
        c = arguments[i];
        if (c) {
            className += " " + c;
        }
    }
    return className;
}

export default cx;
