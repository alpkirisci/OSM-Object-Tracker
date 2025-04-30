#!/bin/bash

# Exit on error
set -e

echo "=== Updating system packages ==="
apt update
apt upgrade -y

echo "=== Installing Docker prerequisites ==="
apt install -y apt-transport-https ca-certificates curl software-properties-common

echo "=== Adding Docker's official GPG key ==="
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -

echo "=== Adding Docker repository ==="
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

echo "=== Installing Docker ==="
apt update
apt install -y docker-ce

echo "=== Installing Docker Compose ==="
curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "=== Adding current user to docker group ==="
usermod -aG docker $USER

echo "=== Verifying installations ==="
docker --version
docker-compose --version

echo "=== Docker and Docker Compose installation complete ==="