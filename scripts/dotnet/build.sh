#!/usr/bin/env bash

set -euo pipefail

projects=(
  "TestApp"
  "StringReplacer"
)
for project in "${projects[@]}"; do
    if [ ! -d "$project" ]; then
        echo "Project directory $project does not exist."
        exit 1
    fi
    rm -rf "$project/bin" "$project/obj"
    dotnet build "$project" --configuration Release --runtime linux-x64
done
