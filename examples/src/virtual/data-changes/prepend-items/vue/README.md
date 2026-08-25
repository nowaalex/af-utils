This example prepends asynchronously loaded records without moving the item the
reader is currently viewing.

It preserves a fractional visible position, updates the collection and cached
sizes together, then restores that position after the insertion.
