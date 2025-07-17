#!/usr/bin/env bash

set -euo pipefail

./scripts/install-task.sh

mkdir -p tmp

task_file=$(realpath ./scripts/taskfile.yaml)
tmp_dir=$(realpath ./tmp)

task -t "$task_file" -d "$tmp_dir" "$@"
