#!/usr/bin/env bash

# Ensure the script is being run with Bash
if [ -z "${BASH_VERSION:-}" ]; then
  echo "This script must be run with Bash."
  exit 1
fi

# Get the absolute path of the script's directory
path_script="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source the shared initialization script
source "$path_script/99_shared_init.sh"  # Load shared init

scripts=(
    0_prepare.sh
    1_download_and_unpack.sh
    2_decompile.sh
    3_edit.sh
    4_build.sh
)

for script in "${scripts[@]}"; do
    echo "Running $script"
    bash "$path_script/$script"
done
