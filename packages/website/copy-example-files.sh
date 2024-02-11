#!/bin/bash

cd ../../examples;
mkdir -p ../packages/website/public/examples;
for f in $(find * -type d -path **/lib -printf '%h\n'); do
    mkdir -p ../packages/website/public/examples/${f};
    cp -r ${f}/lib/* ../packages/website/public/examples/${f};
done;
