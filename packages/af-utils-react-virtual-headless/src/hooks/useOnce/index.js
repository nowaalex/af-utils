import { useRef } from "react";

const useOnce = cb => (useRef().current ||= cb());

export default useOnce;
