param(
    [string]$ImageName = 'simple-ledger-preview',
    [int]$HostPort = 5173
)

# Build the Docker image
Write-Host "Building Docker image: $ImageName"
docker build -t $ImageName .

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed. Make sure Docker is running and you have permission to run it."
    exit $LASTEXITCODE
}

# Run the container mapping port
Write-Host "Running Docker container (http://localhost:$HostPort)"
docker run --rm -p ${HostPort}:5173 $ImageName
