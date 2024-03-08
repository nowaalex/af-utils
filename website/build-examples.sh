#!/bin/bash

rm -rf ./public/examples;
mkdir ./public/examples;
cp -r ../examples/lib/* ./public/examples

echo "export const examples = \"$(realpath ../examples)\";" > ./generatedPaths.ts