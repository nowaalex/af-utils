Lit snapshot controllers subscribe only the host that reads range or
scroll-size events, keeping unrelated content out of the update path.
