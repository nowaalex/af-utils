#!/bin/bash

REFERENCE_FILES_DIR="$(mktemp -d)"
trap 'rm -rf -- "$REFERENCE_FILES_DIR"' EXIT
cp `find ../ -wholename *api-extractor-schema/*.json*` $REFERENCE_FILES_DIR
npx api-documenter markdown -i $REFERENCE_FILES_DIR -o ./reference

# clrf -> lf conversion for code blocks consistency
dos2unix -q ./reference/**

# api-documenter is sophisticated, so converting first h2 to h1 in each file with bash
find ./reference -type f -exec gawk -i inplace '!x{x=sub("## ","# ")}1' {} \;