import prettyBytes from "pretty-bytes";

const sizeColumns = ["raw", "min", "minGz", "minBrotli"] as const;

interface SizesTableProps {
    items: [
        { raw: number; min: number; minGz: number; minBrotli: number },
        name: string
    ][];
}

const SizesTable = ({ items }: SizesTableProps) => {
    switch (items.length) {
        case 0:
            return null;
        case 1:
            return (
                <table>
                    <thead>
                        <tr>
                            <th>Compression</th>
                            <th>Size</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sizeColumns.map(s => (
                            <tr key={s}>
                                <td>{s}</td>
                                <td>{prettyBytes(items[0][0][s])}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        default:
            return (
                <table>
                    <thead>
                        <tr>
                            <th>Package</th>
                            {sizeColumns.map(col => (
                                <th key={col}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(([sizes, name], i) => (
                            <tr key={i}>
                                <td>{name}</td>
                                {sizeColumns.map(col => (
                                    <td key={col}>{prettyBytes(sizes[col])}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
    }
};

export default SizesTable;
