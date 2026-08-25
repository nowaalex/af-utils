This example uses the browser window as the native scroll owner while the
virtual range remains nested inside ordinary page content.

The adapter owns lifecycle wiring; core measures the list's offset within the
page and keeps item geometry synchronized with window scrolling.
