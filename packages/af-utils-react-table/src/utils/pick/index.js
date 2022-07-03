const pick = (obj, props) =>
    props.reduce((acc, prop) => ((acc[prop] = obj[prop]), acc), {});

export default pick;
