Native table layout does not allow a positioning wrapper between `tbody` and
`tr`, so this example uses empty rows before and after the rendered range. A
contained `div` inside each spacer cell provides the virtual scroll extent
without assigning a huge, browser-dependent height directly to `tr`.

Every rendered `tr` is still measured with `ResizeObserver`, so row heights are
derived from their content and can change at any time. The browser's native
table algorithm remains responsible for adaptive column widths.
