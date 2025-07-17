#!/usr/bin/env bash

set -euo pipefail

if ! command -v task &> /dev/null; then
    echo "task not installed, installing..."
    # Install task
    # https://taskfile.dev/installation/
    sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b ~/.local/bin v3.44.0
else
    echo "task already installed, skipped."
fi
