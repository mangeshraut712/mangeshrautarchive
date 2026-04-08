#!/bin/bash

# Check for gcloud in common locations if not in PATH
if ! command -v gcloud &> /dev/null; then
    GCLOUD_PATH="/Users/mangeshraut/google-cloud-sdk/google-cloud-sdk/bin/gcloud"
    if [ -f "$GCLOUD_PATH" ]; then
        alias gcloud="$GCLOUD_PATH"
        export PATH="$PATH:/Users/mangeshraut/google-cloud-sdk/google-cloud-sdk/bin"
    else
        echo "❌ Error: gcloud command not found and not in common locations."
        exit 1
    fi
fi

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
SERVICE_NAME="mangesh-portfolio-api"
REGION="us-central1"

echo "🚀 Starting Google Cloud Run Deployment for 'New Year, New You' Challenge..."

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: Google Cloud Project ID not found. Please run 'gcloud config set project [PROJECT_ID]'"
    exit 1
fi

echo "📦 Project ID: $PROJECT_ID"
echo "🛠️ Service Name: $SERVICE_NAME"
echo "📍 Region: $REGION"

# 1. Enable necessary services
echo "🔌 Enabling Google Cloud Services..."
gcloud services enable \
    artifactregistry.googleapis.com \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    generativelanguage.googleapis.com

# 2. Build and Push Image using Cloud Build
echo "🏗️ Building and pushing container image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# 3. Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars="CLOUD_RUN_ENV=production" \
    --labels dev-tutorial=devnewyear2026

# 4. Get the URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo ""
echo "✅ Deployment Successful!"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "⚠️  Important: Don't forget to set your API keys in the Cloud Run console or via:"
echo "gcloud run services update $SERVICE_NAME --set-env-vars=\"GOOGLE_API_KEY=your_key,OPENROUTER_API_KEY=your_key\""
echo ""
echo "🔗 For the DEV challenge, use this URL in your portfolio embed for 'dev-tutorial=devnewyear2026'"
