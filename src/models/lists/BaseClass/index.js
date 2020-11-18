import PubSub from "../../basic/PubSub";

class BaseClass extends PubSub {

    /* Provided from renderer */
    scrollTop = 0;
    scrollLeft = 0;
    rowsQuantity = 0;
    overscanRowsCount = 0;
    widgetHeight = 0;
    widgetWidth = 0;
    estimatedRowHeight = 20;
    rowsContainerNode = null;

    /* Calculated inside model */
    renderedStartIndex = 0;
    startIndex = 0;
    endIndex = 0;
    virtualTopOffset = 0;
    widgetScrollHeight = 0;

    setRenderedStartIndex( i ){
        this.renderedStartIndex = i;
    }
}

export default BaseClass;