## Why

There are 2 ways of using custom loaders in webpack:

-   place custom loader, named \*-loader, in node_modules
-   import loader in webpack config and put it into resolveLoader section

Second option leads to nextJs webpack cache warnings, so moving this loader to separate workspace.
Also less code is required and things are becoming more modular with this approach.
