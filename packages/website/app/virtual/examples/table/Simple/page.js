"use client";

import { useTable, Root } from "@af-utils/react-table";
import { autorun, observable, runInAction } from "mobx";
import {
    randAnimal,
    randBaseballTeam,
    randAccessory,
    randAlphaNumeric
} from "@ngneat/falso";

const columns = [
    {
        key: "n",
        label: "Some Alphanumeric",
        watch: cell => autorun(() => cell.updateValue())
    },
    { key: "a", label: "Animal" },
    { key: "b", label: "Baseball team" },
    { key: "c", label: "Accessory" }
];

const arr = Array.from({ length: 20 }, () =>
    observable({
        n: randAlphaNumeric(),
        a: randAnimal(),
        b: randBaseballTeam(),
        c: randAccessory()
    })
);

const getRowData = i => arr[i];

const getRowKey = d => d.a;

const SimpleTable = () => {
    const model = useTable({
        columns,
        rowCount: arr.length,
        getRowData,
        getRowKey
    });

    return (
        <>
            <button
                onClick={() =>
                    runInAction(() => {
                        arr.forEach(v => (v.n = randAlphaNumeric()));
                    })
                }
            >
                Change
            </button>
            <Root model={model} />
        </>
    );
};

export default SimpleTable;
