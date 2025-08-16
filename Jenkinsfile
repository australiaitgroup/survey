pipeline {
	agent any

	environment {
		// Application configuration
		APP_NAME = 'survey-app'

		// Application port
		APP_PORT = '5173'

		ADMIN_USERNAME = 'admin'
		ADMIN_PASSWORD = 'password'

		// EC2 deployment configuration
		REGION      = 'ap-southeast-2'
		SSHCreds    = 'jr-keystone-prod' //Runs in the same server as keystone
		SSHUser     = 'ubuntu'
		SSHServerIP = '13.238.204.157'
	}

	stages {
		stage('SSH to EC2 and Deploy') {
			steps {
				echo 'SSH to EC2 and deploying...'

				// Checkout code first
				checkout scm

				withVault([configuration: [ vaultUrl: 'https://vault.jiangren.com.au', vaultCredentialId: 'Vault Credential', timeout: 120],
					vaultSecrets: [[path: 'jr-survey/prod',
						secretValues: [
							[vaultKey: 'MONGO_URI']
						]
					]]
				]) {
					script {
						echo "Environment variables loaded from Vault"
						echo "MONGO_URI: ${MONGO_URI}"

						// Create deployment script for EC2
						def deployScriptContent = """
							#!/bin/bash
							set -e

							echo "=== Deploying Survey App to EC2 ==="

							# Navigate to project directory
							cd /home/ubuntu/survey || mkdir -p /home/ubuntu/survey

							echo "=== Current Working Directory ==="
							pwd
							echo "=== File Listing ==="
							ls -la

							# Step 1: Install Docker Compose
							echo "=== Installing Docker Compose ==="
							if command -v docker-compose &> /dev/null; then
								echo "Docker Compose is already installed"
								docker-compose --version
							else
								echo "Installing Docker Compose..."
								curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
								chmod +x /usr/local/bin/docker-compose
								docker-compose --version
								echo "Docker Compose installed successfully"
							fi

							# Step 2: Stop Old Containers
							echo "=== Stopping Old Containers ==="
							echo "=== Docker Compose Files Check ==="
							if [ -f "docker-compose.prod.yml" ]; then
								echo "✓ docker-compose.prod.yml exists"
							else
								echo "✗ docker-compose.prod.yml missing"
								exit 1
							fi

							# Stop and remove existing survey containers
							sudo docker-compose -f docker-compose.prod.yml down || true

							# Remove only survey-related images
							sudo docker images | grep survey | awk '{print \$3}' | xargs -r docker rmi -f || true

							# Clean up only dangling images
							sudo docker image prune -f

							# Step 3: Build and Deploy
							echo "=== Building and Deploying ==="

							# Create .env file with environment variables
							cat > .env << 'EOF'
MONGODB_URI=${MONGO_URI}
PORT=5173
NODE_ENV=production
ADMIN_USERNAME=${ADMIN_USERNAME}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
EOF

							echo "✅ Environment file created"

							# Validate that required environment variables are set
							if [ -z "${MONGO_URI}" ]; then
								echo "ERROR: MONGO_URI environment variable is required but not set"
								exit 1
							fi

							echo "✅ Using external MongoDB at: ${MONGO_URI}"

							# Build and start services
							echo "Building and starting services..."
							sudo docker-compose -f docker-compose.prod.yml up --build -d

							# Wait for services to start
							sleep 15

							# Check container status
							echo "=== Container Status ==="
							sudo docker-compose -f docker-compose.prod.yml ps

							# Show logs if there are issues
							if ! sudo docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
								echo "=== Container Logs ==="
								sudo docker-compose -f docker-compose.prod.yml logs
								exit 1
							fi

							echo "=== Deployment completed successfully ==="
						"""

						// Execute deployment on EC2
						sshagent(credentials: ["$SSHCreds"]) {
							sh """
								# Copy project files to EC2 using tar over ssh (more commonly available than rsync)
								tar -czf - --exclude='.git' --exclude='node_modules' --exclude='client/node_modules' . | ssh -o StrictHostKeyChecking=no $SSHUser@$SSHServerIP 'mkdir -p /home/ubuntu/survey && cd /home/ubuntu/survey && tar -xzf -'

								# Execute deployment script on EC2 with environment variables and full shell environment
								ssh -o StrictHostKeyChecking=no $SSHUser@$SSHServerIP "source ~/.bashrc && source ~/.profile && MONGO_URI='${MONGO_URI}' ADMIN_USERNAME='${ADMIN_USERNAME}' ADMIN_PASSWORD='${ADMIN_PASSWORD}' /bin/bash -l -s" << 'EOF'
${deployScriptContent}
EOF
							"""
						}
					}
				}
			}
		}

		stage('Health Check') {
			steps {
				echo 'Performing health checks...'
				script {
					sleep 10

					sh '''
					echo "=== Health Check ==="

					# Test application on EC2
					echo "Testing application on EC2..."
					if curl -f --connect-timeout 10 --max-time 30 -s http://13.238.204.157:5173 >/dev/null 2>&1; then
						echo "✅ Application is accessible on EC2 port 5173"
					else
						echo "❌ Application health check failed on EC2"
						exit 1
					fi

					# Test API endpoint
					if curl -f --connect-timeout 10 --max-time 30 -s http://13.238.204.157:5173/api/surveys >/dev/null 2>&1; then
						echo "✅ API endpoint is working on EC2"
					else
						echo "⚠️ API endpoint test failed but continuing..."
					fi

					echo "=== Health Check Completed ==="
					'''
				}
			}
		}
	}

	post {
		always {
			echo 'Pipeline completed'
			cleanWs()
		}
		success {
			echo 'Deployment successful!'
			echo 'Access your application at:'
			echo "  Application: http://13.238.204.157:5173"
			echo "  Admin Dashboard: http://13.238.204.157:5173/admin"
			echo "  API: http://13.238.204.157:5173/api"
		}
		failure {
			echo 'Deployment failed!'
			// You can add failure notifications here
		}
	}
}
