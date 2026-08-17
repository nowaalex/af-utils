const readPoint = point => point.x;

const target = {
    id: "readPoint",
    annotation: false,
    resolve: state => state.readPoint
};

export default {
    name: "runtime diagnostic object control",
    setup: () => ({ readPoint, point: { x: 1 } }),
    teardown: () => {},
    scenarios: [
        {
            id: "read-stable-point",
            targets: [target],
            run({ state, invoke }) {
                invoke(target, undefined, [state.point]);
            }
        }
    ]
};
