import { writeFile } from "node:fs/promises";
import { arch, cpus, platform, release } from "node:os";

/** Describe the host used for a benchmark result. */
export const getEnvironmentDescription = () =>
    `${platform()} ${release()} (${arch()}), ${cpus()[0]?.model ?? "unknown CPU"}`;

/** Format a Markdown table with stable column widths and alignment. */
export const formatMarkdownTable = (
    headers,
    rows,
    rightAlignedColumns = new Set()
) => {
    const widths = headers.map((header, index) =>
        Math.max(header.length, ...rows.map(row => row[index].length))
    );
    const formatRow = row =>
        `| ${row
            .map((cell, index) =>
                rightAlignedColumns.has(index)
                    ? cell.padStart(widths[index])
                    : cell.padEnd(widths[index])
            )
            .join(" | ")} |`;
    const separator = widths.map((width, index) =>
        rightAlignedColumns.has(index)
            ? `${"-".repeat(width - 1)}:`
            : "-".repeat(width)
    );

    return [
        formatRow(headers),
        formatRow(separator),
        ...rows.map(row => formatRow(row))
    ];
};

/** Write the latest generated benchmark report. */
export const writeBenchmarkReport = async (outputPath, lines) => {
    await writeFile(outputPath, lines.join("\n"));
    console.log(`Benchmark result written to ${outputPath}`);
};
