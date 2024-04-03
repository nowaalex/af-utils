#!/bin/bash

OUTPUT_DIR=./src/content/reference
REFERENCE_FILES_DIR="$(mktemp -d)"
trap 'rm -rf -- "$REFERENCE_FILES_DIR"' EXIT
cp `find ../ -wholename *api-extractor-schema/*.json*` $REFERENCE_FILES_DIR
npx api-documenter markdown -i $REFERENCE_FILES_DIR -o $OUTPUT_DIR

# clrf -> lf conversion for code blocks consistency
dos2unix -q $OUTPUT_DIR/**

# api-documenter is sophisticated, so converting first h2 to h1 in each file with bash
find $OUTPUT_DIR -type f -exec gawk -i inplace '!x{x=sub("## ","# ")}1' {} \;

# https://github.com/microsoft/rushstack/pull/4578
#
# after fixing this stuff api-documenter team broke all newlines before **Returns:** blocks, which are crucial for markdown formatting
find $OUTPUT_DIR -type f -exec sed -i 's/\*\*Returns:\*\*/\n\*\*Returns\*\*/g' {} \;