# ==============================================================
# build-and-deploy.ps1
# Script deploy Nexera lên server 162.4.176.246
# Chạy: .\build-and-deploy.ps1
# ==============================================================

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  NEXERA AUTO DEPLOY" -ForegroundColor Cyan
Write-Host "  Build Local → SCP → Deploy lên nexeragroup.vn" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# ── 0. Load cấu hình ──────────────────────────────────────────
$DeployEnvPath = Join-Path $ProjectRoot ".deploy.env"
$EnvPath       = Join-Path $ProjectRoot ".env"

if (-not (Test-Path $DeployEnvPath)) {
    Write-Host "❌ Không tìm thấy .deploy.env!" -ForegroundColor Red
    Write-Host "   Hãy copy và điền thông tin:" -ForegroundColor Yellow
    Write-Host "   cp .deploy.env.example .deploy.env" -ForegroundColor Yellow
    exit 1
}

function Read-EnvFile($path) {
    $vars = @{}
    Get-Content $path | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line -match '^([^=]+)=(.*)$') {
            $vars[$Matches[1].Trim()] = $Matches[2].Trim()
        }
    }
    return $vars
}

$Deploy = Read-EnvFile $DeployEnvPath

if (Test-Path (Join-Path $ProjectRoot ".env.production")) {
    Write-Host "📄 Tìm thấy .env.production, sử dụng cấu hình Production!" -ForegroundColor Green
    $Env = Read-EnvFile (Join-Path $ProjectRoot ".env.production")
    $EnvUploadPath = "$ProjectRoot\.env.production"
} else {
    Write-Host "⚠️ Không có .env.production, sử dụng .env mặc định!" -ForegroundColor Yellow
    $Env = Read-EnvFile $EnvPath
    $EnvUploadPath = "$ProjectRoot\.env"
}

$SERVER_USER    = $Deploy['SERVER_USER']
$SERVER_IP      = $Deploy['SERVER_IP']
$SSH_PORT       = $Deploy['SSH_PORT']
$SERVER_PASS    = $Deploy['SERVER_PASS']
$CERTBOT_EMAIL  = $Deploy['CERTBOT_EMAIL']

Write-Host "📋 Thông tin deploy:" -ForegroundColor Yellow
Write-Host "   Server  : ${SERVER_USER}@${SERVER_IP}:${SSH_PORT}"
Write-Host "   Frontend: https://nexeragroup.vn"
Write-Host "   Backend : https://api.nexeragroup.vn"
Write-Host ""

# ── 1. Kiểm tra & cài Posh-SSH ────────────────────────────────
Write-Host "🔍 Kiểm tra Posh-SSH module..." -ForegroundColor Yellow
if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
    Write-Host "📦 Cài đặt Posh-SSH..." -ForegroundColor Cyan
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser
    Write-Host "✅ Posh-SSH đã được cài đặt!" -ForegroundColor Green
} else {
    Write-Host "✅ Posh-SSH đã có sẵn." -ForegroundColor Green
}
Import-Module Posh-SSH

# ── 2. Kiểm tra Docker đang chạy ──────────────────────────────
Write-Host ""
Write-Host "🐳 Kiểm tra Docker..." -ForegroundColor Yellow
# Tạm tắt strict mode để WARNING từ docker không bị coi là lỗi
$_eap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$null = docker info 2>&1
$ErrorActionPreference = $_eap

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker chưa khởi động!" -ForegroundColor Red
    Write-Host "   → Hãy mở Docker Desktop và chờ đến khi icon Docker ở taskbar chuyển sang màu xanh." -ForegroundColor Yellow
    Write-Host "   → Sau đó chạy lại script này." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Docker đang chạy." -ForegroundColor Green

# ── 3. Tạo thư mục dist ───────────────────────────────────────
$DistDir = Join-Path $ProjectRoot "dist"
New-Item -ItemType Directory -Path $DistDir -Force | Out-Null

# ── 4. Build Docker Images ────────────────────────────────────
Write-Host ""
Write-Host "🔨 [1/2] Build nexera-backend image..." -ForegroundColor Cyan
docker build `
    -t tmquan3007/nexera-backend:latest `
    -f "$ProjectRoot\nexera-backend\Dockerfile" `
    "$ProjectRoot\nexera-backend"

if ($LASTEXITCODE -ne 0) { Write-Host "❌ Build backend thất bại!" -ForegroundColor Red; exit 1 }
Write-Host "✅ tmquan3007/nexera-backend:latest đã build xong!" -ForegroundColor Green

Write-Host ""
Write-Host "🔨 [2/2] Build nexera-frontend image..." -ForegroundColor Cyan
docker build `
    -t tmquan3007/nexera-frontend:latest `
    --build-arg "NEXT_PUBLIC_SUPABASE_URL=$($Env['NEXT_PUBLIC_SUPABASE_URL'])" `
    --build-arg "NEXT_PUBLIC_SUPABASE_ANON_KEY=$($Env['NEXT_PUBLIC_SUPABASE_ANON_KEY'])" `
    --build-arg "NEXT_PUBLIC_BACKEND_URL=$($Env['NEXT_PUBLIC_BACKEND_URL'])" `
    -f "$ProjectRoot\nexera-frontend\Dockerfile" `
    "$ProjectRoot\nexera-frontend"

if ($LASTEXITCODE -ne 0) { Write-Host "❌ Build frontend thất bại!" -ForegroundColor Red; exit 1 }
Write-Host "✅ tmquan3007/nexera-frontend:latest đã build xong!" -ForegroundColor Green

# ── 5. Push images lên Docker Hub ────────────────────────────
Write-Host ""
Write-Host "🚀 Đang đẩy (Push) images lên Docker Hub..." -ForegroundColor Yellow

Write-Host "   Đang push tmquan3007/nexera-backend..."
docker push tmquan3007/nexera-backend:latest
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Push backend thất bại! (Bạn đã đăng nhập docker login chưa?)" -ForegroundColor Red; exit 1 }

Write-Host "   Đang push tmquan3007/nexera-frontend..."
docker push tmquan3007/nexera-frontend:latest
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Push frontend thất bại! (Bạn đã đăng nhập docker login chưa?)" -ForegroundColor Red; exit 1 }

Write-Host "✅ Push hoàn tất!" -ForegroundColor Green

# ── 6. Kết nối SSH ────────────────────────────────────────────
Write-Host ""
Write-Host "🔐 Kết nối SSH tới ${SERVER_IP}:${SSH_PORT}..." -ForegroundColor Yellow

$Credential = New-Object System.Management.Automation.PSCredential(
    $SERVER_USER,
    (ConvertTo-SecureString $SERVER_PASS -AsPlainText -Force)
)

$Session = New-SSHSession -ComputerName $SERVER_IP -Port $SSH_PORT `
    -Credential $Credential -AcceptKey -Force

if (-not $Session.Connected) {
    Write-Host "❌ Không thể kết nối SSH!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Đã kết nối SSH thành công!" -ForegroundColor Green

# ── 7. Chuẩn bị thư mục trên server ──────────────────────────
Write-Host ""
Write-Host "📁 Chuẩn bị thư mục trên server..." -ForegroundColor Yellow
Invoke-SSHCommand -SessionId $Session.SessionId -Command "mkdir -p /opt/nexera/nginx /tmp/nexera-deploy" | Out-Null

# ── 8. SCP files lên server ───────────────────────────────────
Write-Host ""
Write-Host "📤 Đang upload files lên server..." -ForegroundColor Yellow

$SshParams = @{
    SessionId   = $Session.SessionId
    Credential  = $Credential
    ComputerName = $SERVER_IP
    Port        = $SSH_PORT
    AcceptKey   = $true
    Force       = $true
}

function Upload-File($localPath, $remotePath) {
    $fileName = Split-Path $localPath -Leaf
    Write-Host "   → $fileName" -ForegroundColor Gray
    Set-SCPItem -ComputerName $SERVER_IP -Port $SSH_PORT `
        -Credential $Credential -AcceptKey -Force `
        -Path $localPath -Destination $remotePath
}

Upload-File "$ProjectRoot\docker-compose.yml"            "/tmp/nexera-deploy/"
Upload-File $EnvUploadPath                               "/tmp/nexera-deploy/"
Upload-File "$ProjectRoot\nginx\nexeragroup.vn.conf"     "/tmp/nexera-deploy/"
Upload-File "$ProjectRoot\remote-setup.sh"               "/tmp/nexera-deploy/"

Write-Host "✅ Upload hoàn tất!" -ForegroundColor Green

# ── 9. Chạy remote-setup.sh trên server ───────────────────────
Write-Host ""
Write-Host "🚀 Đang chạy remote-setup.sh trên server..." -ForegroundColor Cyan
Write-Host "   (Quá trình này mất khoảng 2-5 phút)" -ForegroundColor Gray
Write-Host ""

$setupCmd = "sed -i 's/\r$//' /tmp/nexera-deploy/* 2>/dev/null; chmod +x /tmp/nexera-deploy/remote-setup.sh && bash /tmp/nexera-deploy/remote-setup.sh '$CERTBOT_EMAIL' 2>&1"
$result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $setupCmd -TimeOut 600

# In output từ server
$result.Output | ForEach-Object { Write-Host "   $_" }

if ($result.ExitStatus -ne 0) {
    Write-Host ""
    Write-Host "❌ Deploy thất bại! Xem log ở trên." -ForegroundColor Red
    Remove-SSHSession -SessionId $Session.SessionId | Out-Null
    exit 1
}

# ── 10. Dọn dẹp ───────────────────────────────────────────────
Remove-SSHSession -SessionId $Session.SessionId | Out-Null

# (Đã xóa thao tác .tar file)

# ── 11. Kết quả ───────────────────────────────────────────────
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  🎉 DEPLOY THÀNH CÔNG!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 Frontend : https://nexeragroup.vn" -ForegroundColor Cyan
Write-Host "  🔧 Backend  : https://api.nexeragroup.vn" -ForegroundColor Cyan
Write-Host ""
Write-Host "  💡 Nếu SSL chưa active, DNS có thể chưa trỏ về:" -ForegroundColor Yellow
Write-Host "     162.4.176.246" -ForegroundColor Yellow
Write-Host "     Sau khi DNS trỏ đúng, chạy lại script này." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
