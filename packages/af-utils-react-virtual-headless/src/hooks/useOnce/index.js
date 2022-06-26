import { useRef } from "react";

const useOnce = cb => {
    const v = useRef();
    return (v.current ||= cb());
};

export default useOnce;
