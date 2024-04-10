#!/bin/bash

timeStart=$(date +%s%N)
OUTPUT_DIR=./src/content/reference
REFERENCE_FILES_DIR="$(mktemp -d)"

trap 'rm -rf -- "$REFERENCE_FILES_DIR"' EXIT
cp `find ../ -wholename *api-extractor-schema/*.json*` $REFERENCE_FILES_DIR
API_DOCUMENTER_LINK_BASE=/virtual/reference/ npx api-documenter markdown -i $REFERENCE_FILES_DIR -o $OUTPUT_DIR

for file in $OUTPUT_DIR/*; do
    # api-documenter is sophisticated, so converting first h2 to h1 in each file with bash
    gawk -i inplace '!x{x=sub("## ","# ")}1' $file

    # https://github.com/microsoft/rushstack/pull/4578
    #
    # after fixing this stuff api-documenter team broke all newlines before **Returns:** blocks, which are crucial for markdown formatting
    sed -i 's/\*\*Returns:\*\*/\n\*\*Returns\*\*/g' $file

    # adding slug to comply with astro slug requirements
    sed -i "1 i---\nslug: $(basename -s ".md" -- $file) \n---\n" $file
done

timeEnd=$(date +%s%N)
echo "Docs built in: $(($(($timeEnd-$timeStart))/1000000)) ms"