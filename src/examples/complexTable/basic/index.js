import Table from  "af-virtual-scroll/ComplexTable";

const faker = require( "faker" );

const rows = Array.from({ length: 1000 }, (v, i) => ({
    i,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    country: faker.address.country()
}))

const SimpleTable = () => (
    <Table
        rowsQuantity={rows.length}
        getRowData={i => rows[ i ]}
        columns={[ "i", "firstName", "lastName", "country" ]}
    />
);

export default SimpleTable;