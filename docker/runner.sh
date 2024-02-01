#!/bin/bash
set -xe

if [[ "$RUNNER" = "lite" ]]; then
    yarn lite
else
    yarn dev
fi
