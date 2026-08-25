This example loads another data batch when the rendered range approaches the
end of the current collection.

It keeps request deduplication, range subscription, append behavior, and
lifecycle cleanup together so repeated range events cannot start duplicate
loads.
