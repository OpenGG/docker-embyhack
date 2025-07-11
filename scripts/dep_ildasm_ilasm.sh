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

arch=${ARCH:-"linux-x64"}

if [[ "$arch" == *"linux"* && "$(uname -s)" != "Linux" ]]; then
  echo "Error: The architecture is set to 'linux-x64', but the system is not Linux."
  exit 1
fi

ildasm_version=9.0.7
ildasm_url="https://www.nuget.org/api/v2/package/runtime.${arch}.Microsoft.NETCore.ILDAsm/$ildasm_version"

ilasm_version=9.0.7
ilasm_url="https://www.nuget.org/api/v2/package/runtime.${arch}.Microsoft.NETCore.ILAsm/$ilasm_version"

download_and_extract() {
  local url="$1"
  local name="$2"
  local zip_file="${name}.zip"

  rm -rf "${path_kitchen}"
  mkdir -p "${path_kitchen}"

  cd "${path_kitchen}" || {
    echo "Failed to enter kitchen directory at ${path_kitchen}."
    exit 1
  }

  curl -L "$url" -o "$zip_file"

  unzip "$zip_file" -d "package" || {
    echo "Failed to unzip $name package."
    exit 1
  }

  cp "package/runtimes/linux-x64/native/$name" "${path_bin}/$name" || {
    echo "Failed to copy $name binary."
    exit 1
  }

  chmod +x "${path_bin}/$name" || {
    echo "Failed to make $name executable."
    exit 1
  }
}
if [ "${1:-}" == "ildasm" ]; then
  echo "Downloading and extracting ILDASM..."
  download_and_extract "$ildasm_url" "ildasm"
elif [ "${1:-}" == "ilasm" ]; then
  echo "Downloading and extracting ILASM..."
  download_and_extract "$ilasm_url" "ilasm"
else
  echo "Usage: $0 <ildasm|ilasm>"
  exit 1
fi
