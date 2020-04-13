import React from "react";
import { act } from "react-dom/test-utils";
import { render, unmountComponentAtNode } from "react-dom";
import pretty from "pretty";
import Cell from "../Cell";

let container = null;

beforeEach(() => {
	container = document.createElement("tr");
	document.body.appendChild(container);
});

afterEach(() => {
	unmountComponentAtNode(container);
	container.remove();
	container = null;
});

describe("Table DefaultCellComponent renders ok", () => {
	test("Performs initial render with default props", () => {
		act(() => {
			render(
				<Cell
					rowData={{ key1: "data1", key2: "data2" }}
					rowIndex={1}
					column={{ dataKey: "key1" }}
					columnIndex={1}
				/>,
				container
			);
		});

		expect(pretty(container.innerHTML)).toMatchSnapshot();
    });
    
    test("renders &nbsp; when cellData is empty", () => {
        act(() => {
			render(
				<Cell
					rowData={{}}
					rowIndex={1}
					column={{ dataKey: "key1" }}
					columnIndex={1}
				/>,
				container
			);
		});

		expect(pretty(container.innerHTML)).toMatchSnapshot();
    });
});
