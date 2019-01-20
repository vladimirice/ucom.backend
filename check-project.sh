#!/bin/bash

echo "Let's check project"
gitOutput="$(git status --porcelain)"

if [[ -z "$gitOutput" ]]; then
echo "Working directory clean"
else
    echo ERROR: Git status - there are changes. Please commit them. ${gitOutput}. 1>&2
    exit 1 # terminate and indicate error
fi
