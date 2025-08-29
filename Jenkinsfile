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

		// AWS S3 configuration for frontend
		AWS_DEFAULT_REGION = 'ap-southeast-2'
		CLIENT_S3_BUCKET = 'sigmaq.co'  // 替换为实际的生产环境bucket名称
	}

	stages {
		stage('Checkout') {
			steps {
				echo 'Checking out source code...'
				checkout scm
			}
		}

		stage('Build Client') {
			steps {
				echo 'Building client application...'
				dir('client') {
					sh '''
						echo "=== Installing client dependencies ==="
						npm install

						echo "=== Building client application for production ==="
						npm run build

						echo "=== Verifying build output ==="
						if [ -d "dist" ]; then
							echo "✓ Client build successful"
							ls -la dist/
						else
							echo "✗ Client build failed - dist directory not found"
							exit 1
						fi
					'''
				}
			}
		}

		stage('Build Super Admin') {
			steps {
				echo 'Building super admin application...'
				dir('super-admin') {
					sh '''
						echo "=== Installing super admin dependencies ==="
						npm install

						echo "=== Building super admin application for production ==="
						npm run build

						echo "=== Verifying build output ==="
						if [ -d "dist" ]; then
							echo "✓ Super admin build successful"
							ls -la dist/
						else
							echo "✗ Super admin build failed - dist directory not found"
							exit 1
						fi
					'''
				}
			}
		}

		stage('Deploy Frontend to S3') {
			steps {
				echo 'Deploying frontend applications to S3...'
				withVault([
					configuration: [
						timeout: 60,
						vaultCredentialId: 'Vault Credential',
						vaultUrl: 'https://vault.jiangren.com.au'
					],
					vaultSecrets: [[
						path: 'secret_aws/aws_prod',
						secretValues: [
							[vaultKey: 'AWS_ACCESS_KEY_ID'],
							[vaultKey: 'AWS_SECRET_ACCESS_KEY']
						]
					]]
				]) {
					script {
						parallel(
							'Deploy Client to S3': {
								dir('client') {
									sh '''
										echo "=== Deploying client to production S3 ==="
										export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
										export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
										export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION}"

										aws s3 sync dist/ s3://${CLIENT_S3_BUCKET}/ --delete

										echo "=== Setting S3 website configuration ==="
										aws s3 website s3://${CLIENT_S3_BUCKET}/ --index-document index.html

										echo "✅ Client deployed successfully to production S3"
									'''
								}
							},
							'Deploy Super Admin to S3': {
								dir('super-admin') {
									sh '''
										echo "=== Deploying super admin to main production S3 bucket ==="
										export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
										export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
										export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION}"

										# 部署到主S3 bucket的super-admin子目录
										aws s3 sync dist/ s3://${CLIENT_S3_BUCKET}/super-admin/ --delete

										echo "✅ Super admin deployed successfully to main production S3 bucket"
									'''
								}
							}
						)
					}
				}
			}
		}

		stage('Deploy Backend to EC2') {
			steps {
				echo 'Deploying backend to EC2...'

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
			echo 'Access your applications at:'
			echo "  Backend API: http://13.238.204.157:5173/api"
			echo "  Client (S3): https://${CLIENT_S3_BUCKET}.s3-website-${AWS_DEFAULT_REGION}.amazonaws.com"
			echo "  Super Admin (S3): https://${CLIENT_S3_BUCKET}.s3-website-${AWS_DEFAULT_REGION}.amazonaws.com/super-admin/"
			echo ""
			echo "Frontend deployed to S3, Backend deployed to EC2."
		}
		failure {
			echo 'Deployment failed!'
			// You can add failure notifications here
		}
	}
}
