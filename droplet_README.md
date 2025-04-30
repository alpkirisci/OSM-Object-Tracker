# Digital Ocean Droplet - Docker Setup Guide

This guide explains how to deploy your application on a Digital Ocean droplet using Docker and Docker Compose.

## Initial Setup

### 1. Accessing your droplet

#### Option A: Using SSH (Recommended)

```bash
ssh username@your-droplet-ip
```

#### Option B: Using Digital Ocean Console

If you cannot SSH into your droplet (due to network restrictions, SSH key issues, etc.), you can use Digital Ocean's Console:

1. Log in to your Digital Ocean account
2. Navigate to the Droplets section
3. Select your droplet
4. Click on the "Console" button (or "Launch Console")
5. This opens a web-based terminal connected to your droplet

The console provides the same functionality as SSH but through your web browser.

### 2. Copy your application files to the droplet

Choose one of these methods to transfer your application files:

#### Option A: Using Git (Recommended)

If your project is in a Git repository:

```bash
# On the droplet
mkdir -p /opt/app
cd /opt/app
git clone https://github.com/your-username/your-repo.git .
```

For private repositories, you may need to set up SSH keys or use a personal access token.

#### Option B: Using SCP

Copy files directly from your local machine:

```bash
# From your local machine
scp -r /path/to/your/application/* username@your-droplet-ip:/opt/app/
```

#### Option C: Using SFTP

```bash
# From your local machine
sftp username@your-droplet-ip
mkdir /opt/app
cd /opt/app
put -r /path/to/your/application/*
```

#### Option D: Using Rsync (Efficient for large projects)

```bash
# From your local machine
rsync -avz --progress /path/to/your/application/ username@your-droplet-ip:/opt/app/
```


### 3. Run the Docker setup script

After copying your files, the setup script is inside the project root:

```bash
# From your local machine
scp docker-setup.sh username@your-droplet-ip:/opt/app/
```

Make the script executable and run it:

```bash
# On the droplet
cd /opt/app
chmod +x droplet_setup_docker-compose.sh
sudo ./droplet_setup_docker-compose.sh
```

## Deploying Your Application

### 1. Running your application

After Docker installation is complete, you can start your application:

```bash
cd /opt/app
docker-compose -f docker-compose.prod.yml up --build
```

To run in detached mode (background):

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### 2. Stopping your application

To stop your application and remove volumes:

```bash
docker-compose -f docker-compose.prod.yml down -v
```

## Accessing the Web Application

Once the application is running, you can access it through your web browser using the droplet's IP address:

```
http://your-droplet-ip
```

### Test Users

The following test users are available for testing purposes:

1. Regular User:
   - Username: test_user
   - Email: test@example.com
   - Password: password123

2. Admin User:
   - Username: admin_user
   - Email: admin@example.com
   - Password: admin123

## Useful Docker Commands

### Viewing logs

View logs of all containers:

```bash
docker-compose -f docker-compose.prod.yml logs
```

Follow logs in real-time:

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

View logs of a specific service:

```bash
docker-compose -f docker-compose.prod.yml logs -f service_name
```

### Container management

List running containers:

```bash
docker ps
```

List all containers (including stopped):

```bash
docker ps -a
```

Restart a service:

```bash
docker-compose -f docker-compose.prod.yml restart service_name
```

### System maintenance

Check disk space usage by Docker:

```bash
docker system df
```

Remove unused Docker resources:

```bash
docker system prune
```

## Troubleshooting

If you encounter any issues:

1. Check container status: `docker ps -a`
2. Check service logs: `docker-compose -f docker-compose.prod.yml logs service_name`
3. Verify your docker-compose file for errors
4. Ensure your droplet has sufficient resources (CPU, memory, disk space)

### Common Issue Encountered

During running up the docker-compose file if the process is killed during ESLint stages (check the log) then to fix the issue:
1. Go to your droplet's admin panel in Digital Ocean
2. Enter the "Power" menu
3. Do a power cycle

For more complex issues, refer to the Docker documentation at [docs.docker.com](https://docs.docker.com/).