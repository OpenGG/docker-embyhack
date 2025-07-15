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

# Change to the kitchen directory
cd "$path_kitchen" || {
    echo "Failed to enter kitchen directory at ${path_kitchen}."
    exit 1
}

# ---------- Build the Project ----------
echo "Building the project..."

rm -rf "$path_output"

# use rsync to clone the directory structure
rsync -r $path_script/output_template/ $path_output

mkdir -p $path_output/system

rsync -r $path_stash_js/ $path_output/system
rsync -r $path_stash_dll/ $path_output/system


# ---------- build crypto
echo "Building crypto.js..."

"${command_npm[@]}" build:crypto

path_polyfills="$path_output/system/dashboard-ui/modules/polyfills"

mkdir -p "$path_polyfills"

cp $path_node/dist/crypto.js $path_polyfills/crypto.js

echo "Building docker-compose.yml..."

files=$(find $path_output -path '*/system/*' -type f -printf "%P\n")

cd $path_output
for file in $files; do
  echo $file
  export file
  yq e '.services.emby.volumes += ("./" + env(file) + ":/app/emby/" + env(file) + ":ro")' -i docker-compose.yml
done
