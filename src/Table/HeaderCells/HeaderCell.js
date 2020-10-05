import React, { useEffect } from "react";
import useApi from "../../useApi";
import { observer, useLocalObservable } from "mobx-react-lite";
import { autorun } from "mobx";

const HeaderCell = ({ column, index }) => {

    const { Rows: { aggregators } } = useApi();
    
    const { sort } = aggregators;
    const { sort: colSort, label, title, dataKey } = column;

    const searchState = useLocalObservable(() => ({
        value: aggregators.filtersByDataKey[ dataKey ] || "",
        visible: false,
        toggle(e){
            if(e.altKey){
                e.stopPropagation();
                searchState.visible = !searchState.visible;
            }
        },
        changeHandler( e ){
            searchState.value = e.target.value;
        }
    }));

    useEffect(() => autorun(
        () => aggregators.setFiltering( dataKey, searchState.value ),
        { delay: 300 }
    ), [ dataKey ]);

    return (
        <th
            title={title}
            data-sortable={colSort?"":undefined}
            aria-colindex={index+1}
            aria-sort={sort&&sort.dataKey === dataKey?sort.value:"none"}
            onClick={searchState.toggle}
        >
            {label}
            { searchState.visible ? <input value={searchState.value} onChange={searchState.changeHandler} /> : null }
        </th>
    );
};

export default observer( HeaderCell );