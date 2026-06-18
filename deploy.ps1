# Deploy Frontend to S3 + CloudFront (PowerShell)
# Usage: .\deploy.ps1 -DistributionId "d1a2b3c4d5e6f7"

param(
    [string]$DistributionId = ""
)

$BucketName = "grandmas-liquors-frontend"
$Region = "us-east-2"

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

try {
    Write-Info "🔨 Building frontend..."
    npm run build

    if (-not (Test-Path -Path "dist")) {
        Write-Error "❌ Build failed: dist folder not found"
        exit 1
    }

    Write-Info "📤 Uploading to S3..."
    
    # Get list of files to upload
    $files = Get-ChildItem -Path "dist" -Recurse -File
    
    $uploadCount = 0
    foreach ($file in $files) {
        if ($file.Name -eq "index.html") {
            continue
        }
        
        $relativePath = $file.FullName.Replace((Get-Item "dist").FullName + "\", "").Replace("\", "/")
        
        aws s3 cp $file.FullName "s3://$BucketName/$relativePath" `
            --region $Region `
            --cache-control "public, max-age=31536000" `
            --quiet
        
        $uploadCount++
    }
    
    Write-Success "✅ Static files uploaded ($uploadCount files)"

    Write-Info "📝 Uploading index.html (no cache)..."
    aws s3 cp "dist/index.html" "s3://$BucketName/index.html" `
        --region $Region `
        --content-type "text/html" `
        --cache-control "public, max-age=0, must-revalidate" `
        --quiet

    Write-Success "✅ index.html uploaded"

    if ($DistributionId) {
        Write-Info "🔄 Invalidating CloudFront cache..."
        $invalidationId = aws cloudfront create-invalidation `
            --distribution-id $DistributionId `
            --paths "/*" `
            --query 'Invalidation.Id' `
            --output text
        
        Write-Success "✅ Cache invalidation triggered: $invalidationId"
    }
    else {
        Write-Host "⚠️  Tip: Pass distribution ID for cache invalidation" -ForegroundColor Yellow
        Write-Host "   Usage: .\deploy.ps1 -DistributionId 'd1a2b3c4d5e6f7'" -ForegroundColor Yellow
    }

    Write-Success "✅ Deploy complete!"

    # Get CloudFront URL
    $cloudfrontUrl = aws cloudfront list-distributions `
        --query "DistributionList.Items[?Origins.Items[?DomainName=='$BucketName.s3.$Region.amazonaws.com']].DomainName" `
        --output text | Select-Object -First 1

    if ($cloudfrontUrl) {
        Write-Success "🌐 Frontend available at: https://$cloudfrontUrl"
    }
}
catch {
    Write-Error "❌ Deploy failed: $_"
    exit 1
}
