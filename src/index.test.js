import React from "react";
import { create, act } from "react-test-renderer";
import Table from "./index";

describe( "Table component renders ok", () => {

    test.each([ undefined, -2, -1, 0, 1, 2 ].map( v => [ v ] ))( "Performs initial render with rowCount: %p", rowCount => {
        let component;
        act(() => {
            component = create(
                <Table
                    columns={[]}
                    getRowData={() => ({ a: 1 })}
                    rowCount={rowCount}
                />
            );
        });
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});