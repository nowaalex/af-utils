#!/bin/bash

rm -r ./reference-files/*
cp `find ../ -wholename *api-extractor-schema/*.json*` ./reference-files
npx api-documenter markdown -i ./reference-files -o ./reference