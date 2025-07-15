#!/usr/bin/env bash

set -xe
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

# ---------- Prepare JavaScript Files ----------
# Cleanup and create stash directory for JavaScript files
echo "Preparing JavaScript files..."
rm -rf "$path_stash_js"
mkdir -p "$path_stash_js"

for js in $emby_target_js; do
    echo "Copying JavaScript file: $js"

    # Check if the JS file exists
    if [ ! -f "$path_emby/$js" ]; then
        echo "Error: File $path_emby/$js does not exist. Please run 1_download_emby.sh first."
        exit 1
    fi

    # Create the necessary directories in the stash and copy the file
    mkdir -p "$path_stash_js/$(dirname "$js")"
    cp "$path_emby/$js" "$path_stash_js/$js" || {
        echo "Error: Failed to copy $path_emby/$js."
        exit 1
    }
done

# ---------- Prepare DLL Files ----------
# Cleanup and create stash directory for DLL files
echo "Preparing DLL files..."
rm -rf "$path_stash_dll"
mkdir -p "$path_stash_dll"

for dll in $emby_target_dll; do
    echo "Copying DLL file: $dll"

    # Check if the DLL file exists
    if [ ! -f "$path_emby/$dll" ]; then
        echo "Error: File $path_emby/$dll does not exist. Please run 1_download_emby.sh first."
        exit 1
    fi

    # Create the necessary directories in the stash and copy the file
    mkdir -p "$path_stash_dll/$(dirname "$dll")"
    cp "$path_emby/$dll" "$path_stash_dll/" || {
        echo "Error: Failed to copy $path_emby/$dll."
        exit 1
    }
done

# ---------- Decompile DLL Files ----------
# Cleanup and create the decompiled directory
echo "Preparing for DLL decompilation..."
rm -rf "$path_decompiled"
mkdir -p "$path_decompiled"

for dll in $emby_target_dll; do
    base_name=$(basename "$dll" ".dll")
    echo "Decompiling DLL file: $dll"
    mkdir -p "$path_decompiled/$base_name"

    # Decompile the DLL using ilspycmd
    if ! ildasm -all -typelist -metadata=raw -out="$path_decompiled/$base_name/$base_name.il" "$path_stash_dll/$dll"; then
        echo "Error: Failed to decompile $dll."
        exit 1
    fi

    echo "Successfully decompiled ${dll}"
done

# Final success message
echo "All files prepared and decompiled successfully."
