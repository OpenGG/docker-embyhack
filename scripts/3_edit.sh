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

il_files=$(find "$path_decompiled" -type f -name "*.il")
for il_file in $il_files; do
    echo "Preprocessing file: $il_file"
    
    # Ensure that the target file exists before attempting to edit it
    if [ ! -f "$il_file" ]; then
        echo "Error: File $il_file does not exist. Skipping."
        exit 1
    fi

    "${command_npm[@]}" preprocess-il -- "$il_file"
    ret_code=$?

    if [ $ret_code -ne 0 ]; then
        echo "Error: Failed to preprocess $il_file."
        exit 1
    fi

    # cp "$il_file" "$il_file.bak"
    mv "$il_file.PREPROCESSED" "$il_file"
done

# ---------- Collect Target Files ----------
# Collect the list of target files from decompiled and JS files
target_files=$( \
    grep -r "mb3admin" "$path_decompiled" -l
    find "$path_stash_js" -type f -name "*.js" -print
)

# ---------- Process Target Files ----------
for target_file in $target_files; do
    echo "Processing file: $target_file"
    
    # Ensure that the target file exists before attempting to edit it
    if [ ! -f "$target_file" ]; then
        echo "Error: File $target_file does not exist. Skipping."
        exit 1
    fi

    result=$(
        "${command_npm[@]}" edit -- \
        "$target_file"
    )
    ret_code=$?

    if [ $ret_code -ne 0 ]; then
        echo "Error: Failed to process $target_file."
        exit 1
    fi
    echo "Processed file: $target_file"

    if [ -f "$target_file.EDIT" ]; then
        echo "File $target_file.EDIT created."
        # cp "$target_file" "$target_file.bak"
        mv "$target_file.EDIT" "$target_file"
    else
        echo "File $target_file.EDIT not created."
    fi
done

echo "Starting recompilation..."

for dll in $emby_target_dll; do
    base_name=$(basename "$dll" ".dll")
    echo "Recompiling DLL file: $dll"

    # Decompile the DLL using ilspycmd
    if ! ilasm -dll "$path_decompiled/$base_name/$base_name.il" -out="$path_stash_dll/$dll"; then
        echo "Error: Failed to decompile $dll."
        exit 1
    fi

    echo "Successfully decompiled ${dll}"
done


echo "Processing completed."
