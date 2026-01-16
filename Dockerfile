# Use official Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port 8080 (default for Cloud Run)
EXPOSE 8080

# Environment variables for production
ENV VERCEL_ENV=production
ENV PYTHONUNBUFFERED=1

# Command to run the application using uvicorn
CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "8080"]
