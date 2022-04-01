const debounce = (fn, ms) => {
    let timer = 0;

    const cancel = () => clearTimeout(timer);

    const debounced = (arg1, arg2) => {
        cancel();
        timer = setTimeout(fn, ms, arg1, arg2);
    };

    debounced._cancel = cancel;

    return debounced;
};

export default debounce;
