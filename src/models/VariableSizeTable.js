import createTable from "./createTable";
import VariableSizeList from "./VariableSizeList";

export default createTable( VariableSizeList, instance => {
    instance.prependListener( "#rowsOrder", instance.resetMeasurementsCache );
});