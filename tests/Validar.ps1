param([string]$Datos='content\portfolio.json')
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$dist=Join-Path $root 'dist'
$data=Get-Content -LiteralPath (Join-Path $root $Datos) -Raw -Encoding UTF8|ConvertFrom-Json
$checks=[Collections.Generic.List[string]]::new()
function Assert($condition,$message){if(-not $condition){throw $message};$checks.Add($message)}
foreach($name in @('index.html','styles.css','app.js','data.js','data\portfolio.json','assets\marca.svg')){Assert (Test-Path -LiteralPath (Join-Path $dist $name)) ('Archivo presente: '+$name)}
$html=Get-Content -LiteralPath (Join-Path $dist 'index.html') -Raw -Encoding UTF8
$ids=@([regex]::Matches($html,'\bid="([^"]+)"')|ForEach-Object{$_.Groups[1].Value})
Assert (@($ids|Group-Object|Where-Object{$_.Count -gt 1}).Count -eq 0) 'Identificadores HTML unicos'
foreach($link in [regex]::Matches($html,'href="#([^"]+)"')){Assert ($link.Groups[1].Value -in $ids) ('Ancla existente: '+$link.Groups[1].Value)}
Assert ($html -match '<html lang="es">') 'Idioma espanol declarado'
Assert ($html -match 'name="viewport"') 'Viewport movil declarado'
Assert ($html -match '<dialog[^>]+aria-labelledby=') 'Visor accesible con titulo'
Assert ($html -match 'aria-live="polite"') 'Resultados anunciados a lectores de pantalla'
Assert ($data.certificates.Count -eq @($data.certificates.id|Sort-Object -Unique).Count) 'IDs de certificados unicos'
$public=Get-ChildItem -LiteralPath $dist -Recurse -File -Force
Assert (@($public|Where-Object{$_.Name -match 'extraccion|fuentes|revision|cv-pagina|__pruebas'}).Count -eq 0) 'Sin archivos privados o pruebas en dist'
foreach($file in $public|Where-Object{$_.Extension -in '.html','.js','.json','.css','.svg','.txt'}){
 $text=Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
 Assert ($text -notmatch '(?i)C:\\Users\\|_private/|\b(?:809|829|849)[ -]?\d{3}[ -]?\d{4}\b|\b\d{3}-\d{7}-\d\b') ('Sin datos privados conocidos: '+$file.Name)
 $emails=@([regex]::Matches($text,'(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b')|ForEach-Object{$_.Value})
 Assert (@($emails|Where-Object{$_ -ne $data.links.email}).Count -eq 0) ('Solo correo profesional expresamente autorizado: '+$file.Name)
 Assert ($text -notmatch '(?i)<script[^>]+src="https?://|<link[^>]+href="https?://') ('Sin recursos externos de seguimiento: '+$file.Name)
}
$docFolder=Join-Path $dist 'assets\documents'
$allowed=@(@($data.certificates)+@($data.cv)+@($data.biography)+@($data.badges)|Where-Object{$_.approved -eq $true}|ForEach-Object{[IO.Path]::GetFileName($_.file)})
foreach($file in Get-ChildItem -LiteralPath $docFolder -File -Force){Assert ($file.Name -in $allowed) ('Documento con aprobacion: '+$file.Name)}
$deployed=Get-Content -LiteralPath (Join-Path $dist 'data\portfolio.json') -Raw -Encoding UTF8|ConvertFrom-Json
$visible=@($data.certificates|Where-Object{$_.verified -eq $true})
Assert ($data.certificates.Count -ge 15) 'Origen conserva al menos los 15 registros aprobados'
Assert ($deployed.certificates.Count -eq $visible.Count) 'Solo registros verificados en el catalogo publico'
Assert (@($deployed.certificates|Where-Object{$_.verified -ne $true}).Count -eq 0) 'Sin registros pendientes en JSON publico'
Assert ((@($deployed.certificates.id|Sort-Object) -join '|') -eq (@($visible.id|Sort-Object) -join '|')) 'IDs visibles coherentes con evidencia verificada'
$fallback=(Get-Content -LiteralPath (Join-Path $dist 'data.js') -Raw -Encoding UTF8) -replace '^window\.PORTFOLIO_DATA\s*=\s*',''
$fallback=$fallback.Trim().TrimEnd(';')|ConvertFrom-Json
Assert (@($fallback.certificates|Where-Object{$_.verified -ne $true}).Count -eq 0) 'Sin pendientes en respaldo para archivo local'
Assert ($fallback.certificates.Count -eq $visible.Count) 'Respaldo y JSON con el mismo catalogo visible'
foreach($record in $visible){
 $hasExactDate=$record.date -match '^\d{4}-\d{2}-\d{2}$'
 $hasDocumentedYear=-not$record.date -and [int]$record.year -ge 1900 -and [int]$record.year -le [DateTime]::UtcNow.Year
 Assert ($record.trainingType -and ($hasExactDate -or $hasDocumentedYear)) ('Ficha con tipo y fecha documental: '+$record.id)
}
Assert ([regex]::Matches($html,'<section id="').Count -eq 8) 'Siete secciones numeradas y presentacion inicial'
Assert ($html -notmatch '(?i)Trabajo aplicado|id="proyectos"|href="#proyectos"') 'Sin secciones retiradas en la pagina'
Assert ($deployed.profile.name -eq $data.profile.name) 'Identidad coherente'
$workflow=Get-Content -LiteralPath (Join-Path $root '.github\workflows\pages.yml') -Raw
Assert ($workflow -match 'workflow_dispatch:' -and $workflow -match '(?m)^\s*push:' -and $workflow -match 'branches: \[main\]' -and $workflow.Contains("vars.PAGES_ENABLED == 'true'")) 'Automatización en main con activación explícita y ejecución manual'
Assert ($workflow -match 'path: dist') 'GitHub Pages recibe unicamente dist'
$results=Join-Path $PSScriptRoot 'resultados'
if(-not(Test-Path -LiteralPath $results)){New-Item -ItemType Directory -Path $results|Out-Null}
$checks|Set-Content -LiteralPath (Join-Path $results 'validacion-estatica.txt') -Encoding UTF8
Write-Output ('Validaciones correctas: '+$checks.Count)
