#!/bin/bash

cd ../../
rsync -R --list-only --include lib/** ./examples/**