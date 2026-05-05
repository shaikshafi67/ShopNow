FROM node:20-alpine

WORKDIR /workspace

# Copy package files
COPY app/package*.json ./app/

# Install dependencies
WORKDIR /workspace/app
RUN npm ci

# Copy the rest of the app files
COPY app/ .

# Build the Vite frontend
RUN npm run build

# Expose port 7860 which is required by Hugging Face Spaces
EXPOSE 7860

# Start the Express server
ENV PORT=7860
CMD ["npm", "run", "server"]
