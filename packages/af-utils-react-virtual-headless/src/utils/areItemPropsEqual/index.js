const areItemPropsEqual = (prev, next) =>
    prev.i === next.i && prev.data === next.data;

export default areItemPropsEqual;
