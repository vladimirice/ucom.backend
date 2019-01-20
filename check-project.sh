#!/bin/bash

echo "Let's check project"
OUTPUT="$(git status --porcelain)"

if [[ -z "$OUTPUT" ]]; then
echo "Working directory clean"
else
    echo ERROR: There are changes:  ${OUTPUT}. Please commit them 1>&2
    exit 1 # terminate and indicate error
fi
