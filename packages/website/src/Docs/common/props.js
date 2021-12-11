const commonDefaultProps = {
    as: "div",
    fixed: false,
    estimatedItemSize: 20,
    overscanCount: 3,
}

const commonProps = [
    {
        name: "itemCount",
        type: "number",
        required: true,
        description: "must be > 0"
    },
    {
        name: "className",
        type: "string",
        description: "className, appended to the outermost wrapper"
    },
    {
        name: "as",
        type: "elementType",
        description: "Wrapper element",
        defaultValue: commonDefaultProps.as
    },
    {
        name: "fixed",
        type: "bool",
        defaultValue: commonDefaultProps.fixed.toString(),
        description: (
            <>
                <p>
                    <strong>true</strong> - you guarantee, that all children(except sticky ones) have same height determined by first rendered child.
                </p>
                <p>
                    <strong>false</strong> - special cache is created, which allows rows to have different height.
                    In this case maximum itemCount value is limited to <strong>2_147_483_647</strong> (maximum int32 value),
                    because row heights cache uses bitwise operations.
                </p>
            </>
        )
    },
    {
        name: "overscanCount",
        type: "number",
        defaultValue: commonDefaultProps.overscanCount,
        description: `extra space for rows above and below viewport.
        Normally should not be overriden`
    },
    {
        name: "estimatedItemSize",
        type: "number",
        defaultValue: commonDefaultProps.estimatedItemSize,
        description: `
            This number will NOT be used as an only source of truth.
            It is just a hint to minimize number of waste renders
            and to make scrolling smoother, especially when row heights differ significantly.
        `
    }
];

export default commonProps;