# Use the official Microsoft Playwright image (includes Node.js and all browser binaries)
FROM mcr.microsoft.com/playwright:v1.49.0-noble

# Set the working directory inside the container
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install project dependencies cleanly
RUN npm ci

# Copy the rest of your test project files
COPY . .

# Default command to run your Playwright tests
CMD ["npx", "playwright", "test"]