#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
# Treat unset variables as an error.
# The return value of a pipeline is the status of the last command to exit with a non-zero status.
set -euo pipefail

# ==============================================================================
# SCRIPT CONFIGURATION
# ==============================================================================
# Use the directory of the script as the base for all paths
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

# --- Tool Paths ---
REPLACER_PATH="$SCRIPT_DIR/StringReplacer/bin/Release/net8.0/linux-x64/StringReplacer"
ILDASM_PATH="$SCRIPT_DIR/../../tmp/bin/ildasm" # Adjust if necessary
TEST_APP_SRC_DLL="$SCRIPT_DIR/TestApp/bin/Release/net8.0/linux-x64/TestApp.dll"

# --- Test Parameters ---
TEST_DIR="$SCRIPT_DIR/tmp"
TEST_APP_DLL="$TEST_DIR/TestApp.dll"
PATCHED_APP_DLL="$TEST_DIR/TestApp.patched.dll"

# --- Verification ---
# Define the expected number of replacements for IL code and resources separately.
EXPECTED_IL_REPLACEMENTS=2
EXPECTED_RESOURCE_REPLACEMENTS=2

# --- Replacement Patterns ---
MATCH_PATTERN="https://a.com/users/123/profile|https://a.com/system/info/long/url/long/enough/to/trigger/linebreak"
REPLACE_REGEX="https://a.com/"
REPLACE_CONTENT="https://b.com/"

# --- Colors for Logging ---
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

# Logs a message to the console.
log() {
    echo -e "${YELLOW}>${NC} $1"
}

# Exits the script with a failure message.
fail() {
    echo -e "\n${RED}ERROR: $1${NC}" >&2
    exit 1
}

# Sets up the testing environment.
setup() {
    log "Setting up test environment in '$TEST_DIR'..."

    # Ensure the build script has been run
    "$SCRIPT_DIR/build.sh"

    # if [ ! -f "$REPLACER_PATH" ] || [ ! -f "$TEST_APP_SRC_DLL" ]; then
    #     log "Required binaries not found. Running build.sh..."
    #     if ! "$SCRIPT_DIR/build.sh"; then
    #         fail "Build script failed."
    #     fi
    # fi

    # Clean up previous test runs
    rm -rf "$TEST_DIR"
    mkdir -p "$TEST_DIR"

    # Copy the test application
    cp "$TEST_APP_SRC_DLL" "$TEST_APP_DLL"
    chmod +x "$REPLACER_PATH"
    log "Setup complete."
}

# Runs the StringReplacer tool.
run_patcher() {
    log "Running StringReplacer on '$TEST_APP_DLL'..."

    "$REPLACER_PATH" \
      "$TEST_APP_DLL" \
      --match-pattern "$MATCH_PATTERN" \
      --replace-regex "$REPLACE_REGEX" \
      --replace-content "$REPLACE_CONTENT"

    if [ ! -f "$PATCHED_APP_DLL" ]; then
        fail "Patcher did not create the output file: '$PATCHED_APP_DLL'"
    fi
    log "Patcher finished."
}

# Verifies the patched assembly by decompiling it and checking the content.
verify_patch() {
    log "Verifying patched assembly..."

    local il_output_dir="$TEST_DIR/TestApp.patched.il.output"
    mkdir -p "$il_output_dir"

    local il_file="$il_output_dir/TestApp.patched.il"
    local js_file="$il_output_dir/TestApp.resources.test.js"

    # Decompile the patched DLL. The output IL file contains both the
    # IL code and a representation of the embedded resources.
    log "Decompiling '$PATCHED_APP_DLL' to '$il_file'..."
    "$ILDASM_PATH" "$PATCHED_APP_DLL" -all -typelist -metadata=raw -out="$il_file"

    # --- Verify IL Replacements ---
    # Count occurrences in 'ldstr' (load string) instructions.
    local il_count
    il_count=$(grep 'https://b.com/' "$il_file" | grep -c "$REPLACE_CONTENT" || true)
    log "Found $il_count IL replacements in $il_file. (Expected: $EXPECTED_IL_REPLACEMENTS)"
    if [ "$il_count" -ne "$EXPECTED_IL_REPLACEMENTS" ]; then
        fail "IL verification failed. Expected $EXPECTED_IL_REPLACEMENTS replacements, but found $il_count."
    fi

    # --- Verify Resource Replacements ---
    # Count occurrences in the text representation of resources, which ildasm typically renders as comments.
    local resource_count
    resource_count=$(grep 'https://b.com/' "$js_file" | grep -c "$REPLACE_CONTENT" || true)
    log "Found $resource_count resource replacements in $js_file. (Expected: $EXPECTED_RESOURCE_REPLACEMENTS)"
    if [ "$resource_count" -ne "$EXPECTED_RESOURCE_REPLACEMENTS" ]; then
        fail "Resource verification failed. Expected $EXPECTED_RESOURCE_REPLACEMENTS replacements, but found $resource_count."
    fi
}

# Cleans up the test directory.
cleanup() {
    log "Cleaning up test directory '$TEST_DIR'..."
    rm -rf "$TEST_DIR"
}

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================

# Trap to ensure cleanup runs on script exit (normal or error)
# trap cleanup EXIT

main() {
    setup
    run_patcher
    verify_patch

    echo -e "\n${GREEN}✅ Test passed successfully!${NC}"
}

# Run the main function
main
