# limpiar-conflictos.ps1
Write-Host "🔧 Eliminando marcas de conflicto en archivos del proyecto..." -ForegroundColor Cyan

$extensiones = @("*.ts", "*.tsx", "*.js", "*.json", "*.md", "*.html")

foreach ($extension in $extensiones) {
    Get-ChildItem -Recurse -Include $extension -File | ForEach-Object {
        $path = $_.FullName
        $lines = Get-Content $path
        $filtrado = $lines | Where-Object { $_ -notmatch '^\s*(<<<<<<<|=======|>>>>>>>).*' }
        Set-Content -Path $path -Value $filtrado
        Write-Host "✅ Limpio: $path" -ForegroundColor Green
    }
}

Write-Host "🎉 Limpieza completada." -ForegroundColor Yellow
