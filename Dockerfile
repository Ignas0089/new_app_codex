FROM node:20-slim

# Create app directory
WORKDIR /app

# Install dependencies based on package.json only (leverages Docker layer cache)
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent

# Copy rest of source
COPY . .

# Build the app
RUN npm run build

# Expose Vite preview default port
EXPOSE 5173

# Start the preview server, binding to 0.0.0.0 so the container port is accessible
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
