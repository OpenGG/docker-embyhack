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

# ---------- Cleanup and Setup Kitchen ----------
echo "Cleaning up and preparing kitchen..."

# Remove and recreate the kitchen directory
rm -rf "${path_kitchen}"
mkdir -p "${path_kitchen}"

# Navigate to the kitchen directory
cd "${path_kitchen}" || {
    echo "Failed to enter kitchen directory at ${path_kitchen}."
    exit 1
}

# ---------- Download the File ----------
echo "Downloading ${emby_download_url}..."

# Download the Emby package
if ! curl -O -L --fail "${emby_download_url}"; then
    echo "Failed to download ${emby_download_url}"
    exit 1
fi

# ---------- Verify Download ----------
# Verify the file exists and has size greater than 0
if [ ! -s "${emby_package}" ]; then
    echo "Downloaded file ${emby_package} is empty or does not exist."
    exit 1
fi

# ---------- Unpack the Deb File ----------
echo "Unpacking ${emby_package}..."

# Clean up any previous unpacked content
rm -rf "${path_unpacked}"

# Unpack the downloaded deb file
if ! dpkg-deb -R "${emby_package}" "${path_unpacked}"; then
    echo "Failed to unpack ${emby_package}."
    exit 1
fi

# ---------- Verify Unpack Success ----------
# Check if the unpacking directory exists and is not empty
if [ ! -d "${path_unpacked}" ] || [ -z "$(ls -A "${path_unpacked}")" ]; then
    echo "Unpacking failed or resulted in an empty directory at ${path_unpacked}."
    exit 1
fi

# ---------- Final Success Message ----------
echo "Successfully downloaded and unpacked ${emby_package}."
