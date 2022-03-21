import { Fragment } from "react";
import { observer } from "mobx-react-lite";
import SummaryCell from "../SummaryCell";
import { css } from "@af/styled";

const groupTogglerClass = css(
    "user-select: none",
    "cursor: pointer",
    "padding-right: 0.3em"
);

const columnSummariesClass = css( "margin-left: 1em" );

const getInMap = ( map, path ) => path.reduce(( res, key ) => res.get( key ), map );

const GroupCell = ({ m, columns, i }) => {

    const isCollapsed = m.collapsedGroups.has( i );

    if( m.hasGrouping ){

        const groupPath = m.flattenedGroups.groupValues[~i];

        if( groupPath ){

            const lastGroupIndex = groupPath.length - 1;
            const groupKey = m.groupKeys[lastGroupIndex];
            /* hidden columns also must be included */
            const { getGroupLabel, label, format } = m.columns.find( c => c.key === groupKey );
            const groupValue = groupPath[lastGroupIndex];
            const colsWithFilters = columns.filter( col => !!col.totals );
            return (
                <>
                    <span
                        className={groupTogglerClass}
                        onClick={() => m.toggleCollapsedGroup( i )}
                        data-collapsed={isCollapsed?"":undefined}
                        style={{
                            marginLeft: `${(lastGroupIndex)*2}em`
                        }}
                    >
                        {isCollapsed ? "\u25B8" : "\u25BE"}
                    </span>
                    &nbsp;
                    {getGroupLabel?getGroupLabel(groupValue):(
                        <>
                            {label}:&nbsp;{format?format(groupValue):""+groupValue}
                        </>
                    )}
                    {colsWithFilters.length ? (
                        (<span className={columnSummariesClass}>
                            {colsWithFilters.map(( col, i, arr ) => (
                                <Fragment key={col.key}>
                                    <span>
                                        {col.label}:
                                        &nbsp;
                                        <SummaryCell
                                            m={m}
                                            column={col}
                                            rowIndexes={getInMap(m.grouped,groupPath)}
                                        />
                                    </span>
                                    {i !== arr.length - 1 ? ", " : ""}
                                </Fragment>
                            ))}
                        </span>)
                    ) : null}
                </>
            );
        }
    }

    return null;
};


export default observer( GroupCell );