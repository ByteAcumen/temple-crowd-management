$BaseUrl = "http://localhost:5000/api/v1"

function Register-User {
    param(
        [string]$Name,
        [string]$Email,
        [string]$Password,
        [string]$Role
    )

    Write-Host "Creating $Role user: $Email..." -NoNewline
    
    $body = @{
        name     = $Name
        email    = $Email
        password = $Password
        role     = $Role
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
        Write-Host " SUCCESS" -ForegroundColor Green
    }
    catch {
        $err = $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
            $errBody = $reader.ReadToEnd()
            if ($errBody -match "Email already exists") {
                Write-Host " EXISTS (Skipping)" -ForegroundColor Yellow
            }
            else {
                Write-Host " FAILED: $errBody" -ForegroundColor Red
            }
        }
        else {
            Write-Host " FAILED: $err" -ForegroundColor Red
        }
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   SEEDING DEFAULT USERS                  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Register-User "Admin" "admin@temple.com" "Admin@123456" "admin"
Register-User "Gatekeeper" "gatekeeper@temple.com" "Gate@12345" "gatekeeper"
Register-User "Devotee" "user@temple.com" "User@12345" "user"

Write-Host "`nDone! You can now login with these credentials." -ForegroundColor Green
