param([string]$Datos='content\portfolio.json',[switch]$SoloOrigen)
$ErrorActionPreference='Stop'
$r=Split-Path $PSScriptRoot -Parent
$root=[IO.Path]::GetFullPath((Join-Path $r 'dist'))
$data=Get-Content -LiteralPath (Join-Path $r $Datos) -Raw -Encoding UTF8|ConvertFrom-Json
$registry=Get-Content -LiteralPath (Join-Path $r 'content\autorizaciones-publicacion.json') -Raw -Encoding UTF8|ConvertFrom-Json
if($registry.version -ne 1){throw 'Registro de autorizaciones no compatible'}
$allowed=@('.nojekyll','index.html','styles.css','app.js','data.js','data/portfolio.json','assets/marca.svg')
$names=@{}
foreach($rec in @($data.certificates)+@($data.cv)){
 if($rec.approved -ne $true){continue}
 if($rec.localOnly -or ($rec.id -and $rec.verified -ne $true)){throw 'Documento privado o sin verificación'}
 if($rec.file -notmatch '^assets/documents/[a-z0-9][a-z0-9_.-]*\.(pdf|png|jpe?g)$' -or $rec.file.Contains('..')){throw 'Ruta de publicación inválida'}
 if($names.ContainsKey($rec.file)){throw 'Dos registros no deben compartir la misma copia pública'}
 $names[$rec.file]=$true
 $auth=@($registry.documents|Where-Object{$_.file -ceq $rec.file})
 $when=[DateTimeOffset]::MinValue
 if($auth.Count -ne 1 -or $auth[0].sha256 -notmatch '^[A-Fa-f0-9]{64}$' -or -not$auth[0].authorizedBy -or -not[DateTimeOffset]::TryParse([string]$auth[0].authorizedAt,[ref]$when)){throw ('Falta autorización documentada y SHA256: '+$rec.id)}
 $originalCopy=Join-Path $r ('content\approved\'+[IO.Path]::GetFileName($rec.file))
 $published=Join-Path $root $rec.file
 $paths=@($originalCopy);if(-not$SoloOrigen){$paths+=@($published)}
 foreach($path in $paths){
  if(-not(Test-Path -LiteralPath $path -PathType Leaf)){throw 'Copia autorizada ausente'}
  $item=Get-Item -LiteralPath $path -Force
  if($item.Attributes -band [IO.FileAttributes]::ReparsePoint -or $item.LinkType){throw 'No se admiten vínculos en documentos'}
  if((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash -ne $auth[0].sha256){throw ('El documento cambió después de su autorización: '+$rec.id)}
 }
 $allowed+=$rec.file
}
if($SoloOrigen){Write-Output 'Fuentes y autorizaciones comprobadas antes de copiar';return}
foreach($item in Get-ChildItem -LiteralPath $root -Recurse -Force){
 if($item.Attributes -band [IO.FileAttributes]::ReparsePoint -or $item.LinkType){throw 'No se admiten vínculos en producción'}
 if(-not$item.PSIsContainer){
  $relative=$item.FullName.Substring($root.Length+1).Replace('\','/')
  if($relative -cnotin $allowed){throw ('Archivo fuera de la lista permitida de producción: '+$relative)}
 }
}
$public=Get-Content -LiteralPath (Join-Path $root 'data\portfolio.json') -Raw -Encoding UTF8|ConvertFrom-Json
if(@($public.certificates|Where-Object{$_.verified -ne $true -or $_.localOnly}).Count){throw 'Revisión privada presente en catálogo público'}
$actual=@($public.certificates.id|Sort-Object)
$expected=@($data.certificates|Where-Object{$_.verified -eq $true -and -not$_.localOnly}|ForEach-Object{$_.id}|Sort-Object)
if(($actual -join '|') -cne ($expected -join '|')){throw 'El catálogo público no corresponde a la fuente seleccionada'}
Write-Output ('Producción comprobada: '+$allowed.Count+' archivos permitidos; documentos autorizados: '+$names.Count)