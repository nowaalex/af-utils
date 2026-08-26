This example virtualizes dynamic rows without breaking native table semantics.
Spacer rows represent content above and below the rendered range because a
positioning wrapper cannot sit between `tbody` and `tr`.

Rendered rows still use live measurement, and the browser remains responsible
for adaptive column widths.
