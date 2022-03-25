const debounce = (fn, ms) => {
    let timer = 0;

    const cancel = () => clearTimeout(timer);

    const debounced = arg => {
        cancel();
        timer = setTimeout(fn, ms, arg);
    };

    debounced._cancel = cancel;

    return debounced;
};

export default debounce;
