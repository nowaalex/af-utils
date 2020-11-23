import { Suspense, lazy } from "react";

const RawCode = lazy(() => import( "./Raw" ));

const Code = props => (
    <Suspense fallback="Loading code component...">
        <RawCode {...props} />
    </Suspense>
);

export default Code;