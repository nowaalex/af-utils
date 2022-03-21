import { observer } from "mobx-react-lite";
import { useDrop } from "react-dnd";
import { HEADER_DND_TYPE } from "constants";
import { css } from "@af-utils/styled";

const wrapperClass = css(
    "display: flex",
    "margin: 0.3em 0",
    "flex: 0 0 auto"
);

const GroupsPanel = ({ aggregatorModel: m, GroupLabel }) => {

    const [ collectedProps, dropRef ] = useDrop(() => ({
        accept: HEADER_DND_TYPE,
        drop( item ){
            m.addGrouping( item.key );
        }
    }), [ m ]);

    return m.compact ? null : (
        <div className={wrapperClass} ref={dropRef}>
            {m.groupKeys.length ? m.groupKeys.map( groupKey => (
                <GroupLabel
                    key={groupKey}
                    groupKey={groupKey}
                    columns={m.columns}
                    onRemove={() => m.removeGrouping( groupKey )}
                />
            )) : "Drag column headers here to group by column" }
        </div>
    );
};

export default observer( GroupsPanel );