let hash = 0;

const stepHash = () => (hash = (hash + 1) & 0x7fffffff);

export default stepHash;
