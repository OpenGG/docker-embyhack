#!/usr/bin/env bash

# Enable strict mode to exit on errors and prevent unintended behavior
set -eu
set -o pipefail

# Ensure the script is running with Bash (not Dash or other shells)
if [ -z "${BASH_VERSION:-}" ]; then
  echo "This script must be run with Bash."
  exit 1
fi

# Default configuration values for Emby (used if no environment variables are set)

# Default version of Emby server
DEFAULT_EMBY_VERSION="4.8.11.0"  

# Default package name for Emby server
DEFAULT_EMBY_PACKAGE="emby-server-deb_${DEFAULT_EMBY_VERSION}_amd64.deb"  

# Default target DLL files for Emby
DEFAULT_EMBY_TARGET_DLL="Emby.Server.Implementations.dll \
Emby.Web.dll"  

# Default target JS files for Emby
DEFAULT_EMBY_TARGET_JS="dashboard-ui/embypremiere/embypremiere.js \
dashboard-ui/modules/emby-apiclient/connectionmanager.js"  

# Default target URLs to replace in Emby
DEFAULT_EMBY_TARGET_URLS="https://mb3admin.com/admin/service/registration/validateDevice \
https://mb3admin.com/admin/service/registration/validate \
https://mb3admin.com/admin/service/appstore/register \
https://mb3admin.com/admin/service/registration/getStatus"  

# Default replacement URL for Emby
DEFAULT_EMBY_REPLACEMENT_URL="https://example.com/"  

# Configuration: Set values from environment variables or fall back to defaults

# Use environment variable or default for Emby version
emby_version="${EMBY_VERSION:-$DEFAULT_EMBY_VERSION}"  

# Use environment variable or default for Emby package
emby_package="${EMBY_PACKAGE:-$DEFAULT_EMBY_PACKAGE}"  

# Build the default download URL using the Emby version and package name
DEFAULT_EMBY_DOWNLOAD_URL="https://github.com/MediaBrowser/Emby.Releases/releases/download/${emby_version}/${emby_package}"

# Final configuration values, use environment variable or default value for each

# URL to download Emby server package
emby_download_url="${EMBY_DOWNLOAD_URL:-$DEFAULT_EMBY_DOWNLOAD_URL}"  

# DLL files to target in the Emby package
emby_target_dll="${EMBY_TARGET_DLL:-$DEFAULT_EMBY_TARGET_DLL}"  

# JS files to target in the Emby package
emby_target_js="${EMBY_TARGET_JS:-$DEFAULT_EMBY_TARGET_JS}"  

# URLs to replace in Emby
export emby_target_urls="${EMBY_TARGET_URLS:-$DEFAULT_EMBY_TARGET_URLS}"  

# Replacement URL for Emby
export emby_replacement_url="${EMBY_REPLACEMENT_URL:-$DEFAULT_EMBY_REPLACEMENT_URL}"  

# Path Setup: Determine the script's directory and define various paths used throughout the script

# Get the absolute path of the script's directory
path_script="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Set the bin directory and add it to the PATH
path_bin="$(realpath "${path_script}/../bin")"
mkdir -p "${path_bin}"
export PATH="${path_bin}:${PATH}"

# Define node.js path relative to the script's directory
path_node="${path_script}/node"

command_npm=(npm run --prefix ${path_node})

# Set the kitchen directory to a location in the parent directory of the script
path_kitchen="$(realpath "${path_script}/../tmp")"

# Define paths for various directories under the kitchen

# Directory for unpacked files
path_unpacked="${path_kitchen}/unpacked"  

# Path to the Emby server system files
path_emby="${path_unpacked}/opt/emby-server/system"  

# Directory for stashed DLLs
export path_stash_dll="${path_kitchen}/stash_dll"  

# Directory for stashed JS files
export path_stash_js="${path_kitchen}/stash_js"  

# Directory for decompiled DLLs
export path_decompiled="${path_kitchen}/decompiled_dll"  

# Output directory for results
export path_output="${path_kitchen}/output"  

export file_manifest_js="${path_kitchen}/manifest_js.txt"
export file_manifest_dll="${path_kitchen}/manifest_dll.txt"

# export PATH="${path_node}:${PATH}"
