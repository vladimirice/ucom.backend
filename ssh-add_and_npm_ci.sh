#!/bin/bash

eval "$(ssh-agent -s)"
eval "$(ssh-add ~/.ssh/id_rsa)"
npm ci