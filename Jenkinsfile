pipeline {
	agent any

	environment {
		// Application configuration
		APP_NAME = 'survey-app'

		// Application port
		APP_PORT = '5173'

		ADMIN_USERNAME = 'admin'
		ADMIN_PASSWORD = 'password'
	}

	stages {
		stage('Checkout') {
			steps {
				echo 'Checking out source code...'
				checkout scm
			}
		}

		stage('Install Docker Compose') {
			steps {
				echo 'Installing Docker Compose...'
				sh '''
					# Check if Docker Compose is already installed
					if command -v docker-compose &> /dev/null; then
						echo "Docker Compose is already installed"
						docker-compose --version
					else
						echo "Installing Docker Compose..."

						# Install Docker Compose
						curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
						chmod +x /usr/local/bin/docker-compose

						# Verify installation
						docker-compose --version

						echo "Docker Compose installed successfully"
					fi
				'''
			}
		}

		stage('Stop Old Containers') {
			steps {
				echo 'Stopping old survey containers...'
				sh '''
					echo "=== Current Working Directory ==="
					pwd
					echo "=== File Listing ==="
					ls -la
					echo "=== Docker Compose Files Check ==="
					if [ -f "docker-compose.prod.yml" ]; then
						echo "✓ docker-compose.prod.yml exists"
					else
						echo "✗ docker-compose.prod.yml missing"
					fi
					echo "=== Key Files Check ==="
					if [ -f "server.js" ]; then
						echo "✓ server.js exists"
					else
						echo "✗ server.js missing"
					fi
					if [ -f "Dockerfile.backend" ]; then
						echo "✓ Dockerfile.backend exists"
					else
						echo "✗ Dockerfile.backend missing"
					fi
					if [ -d "client" ]; then
						echo "✓ client directory exists"
						echo "Client directory contents:"
						ls -la client/ | head -10
					else
						echo "✗ client directory missing"
					fi

					# Stop and remove existing survey containers
					docker-compose -f docker-compose.prod.yml down || true

					# Remove only survey-related images
					docker images | grep survey | awk '{print $3}' | xargs -r docker rmi -f || true

					# Clean up only dangling images (not used by any container)
					docker image prune -f
				'''
			}
		}

		stage('Build and Deploy') {
			steps {
				echo 'Building and deploying survey application...'
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

						// Use production compose file only
						def composeFile = 'docker-compose.prod.yml'
						echo "Using compose file: ${composeFile}"

						withEnv(["COMPOSE_FILE=${composeFile}"]) {
							sh '''
							# Create .env file with environment variables
							cat > .env << EOF
MONGODB_URI=${MONGO_URI}
PORT=5173
NODE_ENV=production
ADMIN_USERNAME=${ADMIN_USERNAME}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
EOF

							# Validate that required environment variables are set
							if [ -z "${MONGO_URI}" ]; then
								echo "ERROR: MONGO_URI environment variable is required but not set"
								echo "Please ensure your external MongoDB URI is configured in Vault"
								exit 1
							fi
							
							echo "✅ Using external MongoDB at: ${MONGO_URI}"

							echo "=== Starting Docker Containers ==="
							echo "Using compose file: $COMPOSE_FILE"

							# Stop any existing containers
							docker-compose -f $COMPOSE_FILE down || true

							# Build and start services
							docker-compose -f $COMPOSE_FILE up --build -d

							# Wait for services to start
							sleep 15

							# Check container status
							echo "=== Container Status ==="
							docker-compose -f $COMPOSE_FILE ps

							# Show logs if there are issues
							if ! docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
								echo "=== Container Logs ==="
								docker-compose -f $COMPOSE_FILE logs
								exit 1
							fi
							'''
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

					def composeFile = 'docker-compose.prod.yml'

					withEnv(["COMPOSE_FILE=${composeFile}"]) {
						sh '''
						echo "=== Health Check ==="

						# Check container status
						docker-compose -f $COMPOSE_FILE ps

						# Test application on port 5173
						echo "Testing application..."
						if curl -f --connect-timeout 10 --max-time 30 -s http://localhost:5173 >/dev/null 2>&1; then
							echo "✅ Application is accessible on port 5173"
						else
							echo "❌ Application health check failed"
							echo "Container logs:"
							docker-compose -f $COMPOSE_FILE logs --tail 20
							exit 1
						fi

						# Test API endpoint
						if curl -f --connect-timeout 10 --max-time 30 -s http://localhost:5173/api/surveys >/dev/null 2>&1; then
							echo "✅ API endpoint is working"
						else
							echo "⚠️ API endpoint test failed but continuing..."
						fi

						echo "=== Health Check Completed ==="
						'''
					}
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
			echo "  Application: http://localhost:5173"
			echo "  Admin Dashboard: http://localhost:5173/admin"
			echo "  API: http://localhost:5173/api"
			// You can add notifications here (Slack, email, etc.)
		}
		failure {
			echo 'Deployment failed!'
			// You can add failure notifications here
		}
	}
}
