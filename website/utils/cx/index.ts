const cx = (...args: (string | undefined)[]) =>
    args.filter(arg => !!arg).join(" ");

export default cx;
