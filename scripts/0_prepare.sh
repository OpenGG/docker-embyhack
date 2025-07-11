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

# ---------- Helper Functions ----------

# Function to check if a dependency is installed
check_dependency() {
    local tool="$1"
    local install_cmd="$2"

    # Check if the tool exists in PATH
    if command -v "$tool" &> /dev/null; then
        return 0
    fi

    # Check if the tool is installed as a dotnet global tool
    if dotnet tool list --global | grep -qw "$tool"; then
        return 0
    fi

    return 1
}

# Function to print installation instructions for a missing tool
print_install_instructions() {
    local tool="$1"
    local install_cmd="$2"
    echo -e "  \e[32m${install_cmd}\e[0m"
}

# ---------- Main Script ----------

echo "Checking dependencies..."

# Define required dependencies and their installation commands
declare -A dependencies=(
    ["dotnet"]="sudo apt update && sudo apt install -y dotnet-sdk-8.0"  # Dotnet SDK installation command
    ["rsync"]="sudo apt update && sudo apt install -y rsync"  # yq installation command
    ["yq"]="sudo curl -L \\
    https://github.com/mikefarah/yq/releases/download/v4.45.2/yq_linux_amd64 \\
    -o /usr/local/bin/yq &&\\
    sudo chmod +x /usr/local/bin/yq"  # yq installation command
    # ["ilspycmd"]="dotnet tool install --global ilspycmd"  # ilspycmd installation command
    # ["ilrepack"]="dotnet tool install --global dotnet-ilrepack"  # ilrepack installation command
    ["ildasm"]="$path_script/dep_ildasm_ilasm.sh ildasm"  # ILDASM script path
    ["ilasm"]="$path_script/dep_ildasm_ilasm.sh ilasm"  # ILASM script path
)

# Array to track missing tools
missing_tools=()

# Check if each dependency is installed
for tool in "${!dependencies[@]}"; do
    echo "Checking for $tool..."
    if ! check_dependency "$tool" "${dependencies[$tool]}"; then
        missing_tools+=("$tool")
    fi
done

# If any tools are missing, print instructions to install them
if [ ${#missing_tools[@]} -ne 0 ]; then
    echo "[!] Missing dependencies: ${missing_tools[*]}"

    # Print install instructions for each missing tool
    for tool in "${missing_tools[@]}"; do
        echo ""
        echo "To install ${tool}:"
        print_install_instructions "$tool" "${dependencies[$tool]}"
        
        # Special instructions for dotnet
        if [ "$tool" = "dotnet" ]; then
            echo "  # For other OS, visit https://dotnet.microsoft.com/download"
        fi
        
        echo ""
    done
    
    # Provide a final instruction for setting the path for dotnet tools
    echo -e "  \e[32mexport PATH=\"\$PATH:\$HOME/.dotnet/tools\"\e[0m"
    echo ""

    exit 1
fi

cd $path_node
pnpm install

# All dependencies are installed
echo "Dependencies are all set!"
exit 0
