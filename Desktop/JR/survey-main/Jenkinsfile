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

						// Execute deployment on EC2
						sshagent(credentials: ["$SSHCreds"]) {
							sh """
								# Copy project files to EC2 using tar over ssh (more commonly available than rsync)
								tar -czf - --exclude='.git' --exclude='node_modules' --exclude='client/node_modules' . | ssh -o StrictHostKeyChecking=no $SSHUser@$SSHServerIP 'mkdir -p /home/ubuntu/survey && cd /home/ubuntu/survey && tar -xzf -'

								# Execute deployment script on EC2 with environment variables
								ssh -o StrictHostKeyChecking=no $SSHUser@$SSHServerIP "cd /home/ubuntu/survey && chmod +x deploy.sh && MONGO_URI='${MONGO_URI}' ADMIN_USERNAME='${ADMIN_USERNAME}' ADMIN_PASSWORD='${ADMIN_PASSWORD}' ./deploy.sh"
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
