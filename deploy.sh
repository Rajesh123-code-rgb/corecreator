#!/bin/bash

# Pull latest changes (if you are running this from the repo on the server)
# git pull origin main

# Build and restart the container
docker compose -f docker-compose.prod.yml up -d --build

# Remove unused images to save space
docker image prune -f

echo "Deployment completed successfully!"
