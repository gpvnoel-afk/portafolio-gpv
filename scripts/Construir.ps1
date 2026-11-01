param([switch]$ParaPublicar,[string]$Datos='content\portfolio.json')
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$dist=Join-Path $root 'dist'
$contentPath=Join-Path $root $Datos
$raw=Get-Content -LiteralPath $contentPath -Raw -Encoding UTF8
$data=$raw|ConvertFrom-Json
if($data.version -ne 1 -or -not $data.profile.name -or $data.certificates.Count -lt 1){throw 'Catalogo incompleto'}
if($ParaPublicar -and $data.publication.authorized -ne $true){throw 'Publicacion no autorizada: revisar contenido y establecer publication.authorized solo con autorizacion expresa'}
& (Join-Path $PSScriptRoot 'Verificar-produccion.ps1') -Datos $Datos -SoloOrigen
$ids=@{}
$approvedFiles=[Collections.Generic.List[string]]::new()
foreach($item in @($data.certificates)+@($data.cv)+@($data.biography)){
 if($item.id){if($item.id -notmatch '^[a-z0-9-]+$' -or $ids.ContainsKey($item.id)){throw 'ID invalido o repetido'};$ids[$item.id]=$true}
 if($item.year -and ([int]$item.year -lt 1900 -or [int]$item.year -gt [DateTime]::UtcNow.Year)){throw ('Ano no valido: '+$item.id)}
 if($item.approved -eq $true){
  if($item.id -and $item.verified -ne $true){throw 'Una evidencia pendiente de verificar no puede aprobarse'}
  if($item.file -notmatch '^assets/documents/[a-zA-Z0-9][a-zA-Z0-9_.-]*\.(pdf|png|jpg|jpeg)$' -or $item.file.Contains('..')){throw 'Ruta de documento no valida'}
  $name=[IO.Path]::GetFileName($item.file)
  $source=Join-Path $root ('content\approved\'+$name)
  if(-not(Test-Path -LiteralPath $source -PathType Leaf)){throw ('Falta el documento revisado: '+$name)}
  if((Get-Item -LiteralPath $source).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'No se permiten enlaces simbolicos a documentos'}
  $approvedFiles.Add($name)
 }elseif($item.file){throw 'Un documento no aprobado no debe tener ruta publica'}
}
foreach($network in @('linkedin','github')){
 $url=[string]$data.links.$network
 if($url){$parsed=$null;if(-not[Uri]::TryCreate($url,[UriKind]::Absolute,[ref]$parsed) -or $parsed.Scheme -ne 'https' -or $parsed.UserInfo -or $parsed.Host -notin @(($network+'.com'),('www.'+$network+'.com'))){throw ('URL no valida: '+$network)}}
}
if($data.links.email -and $data.links.email -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$'){throw 'Correo no valido'}
$docFolder=Join-Path $dist 'assets\documents'
if(-not(Test-Path -LiteralPath $docFolder)){New-Item -ItemType Directory -Path $docFolder -Force|Out-Null}
# dist is the generated public directory. Do not retain formerly approved files after revocation.
foreach($file in Get-ChildItem -LiteralPath $docFolder -File -Force){
 if($file.Name -notin $approvedFiles){Remove-Item -LiteralPath $file.FullName -Force}
}
foreach($name in $approvedFiles){Copy-Item -LiteralPath (Join-Path $root ('content\approved\'+$name)) -Destination (Join-Path $docFolder $name) -Force}
$dataFolder=Join-Path $dist 'data'
if(-not(Test-Path -LiteralPath $dataFolder)){New-Item -ItemType Directory -Path $dataFolder|Out-Null}
$utf8=[Text.UTF8Encoding]::new($false)
# The complete source remains local; neither public JSON nor file:// fallback contains pending records.
$publicData=$raw|ConvertFrom-Json
$publicData.certificates=@($publicData.certificates|Where-Object{$_.verified -eq $true -and -not$_.localOnly})
$publicRaw=$publicData|ConvertTo-Json -Depth 20
[IO.File]::WriteAllText((Join-Path $dataFolder 'portfolio.json'),$publicRaw,$utf8)
$safeJson=$publicRaw.Replace('<','\u003c').Replace([string][char]0x2028,'\u2028').Replace([string][char]0x2029,'\u2029')
if(-not $ParaPublicar){
 $privateFolder=Join-Path $root '_private'
 if(-not(Test-Path -LiteralPath $privateFolder)){New-Item -ItemType Directory -Path $privateFolder|Out-Null}
 [IO.File]::WriteAllText((Join-Path $privateFolder 'catalogo-revision.json'),$raw,$utf8)
 $pending=@($data.certificates|Where-Object{$_.verified -ne $true})
 [IO.File]::WriteAllText((Join-Path $privateFolder 'pendientes-formacion.json'),(ConvertTo-Json -InputObject $pending -Depth 20),$utf8)
}
[IO.File]::WriteAllText((Join-Path $dist 'data.js'),('window.PORTFOLIO_DATA = '+$safeJson+';'),$utf8)
$index=Join-Path $dist 'index.html'
$html=[IO.File]::ReadAllText($index)
if($ParaPublicar){$html=$html.Replace('content="noindex,nofollow"','content="index,follow"')}else{$html=$html.Replace('content="index,follow"','content="noindex,nofollow"')}
[IO.File]::WriteAllText($index,$html,$utf8)
[IO.File]::WriteAllText((Join-Path $dist '.nojekyll'),'',$utf8)
Write-Output ('Catalogo listo: '+$data.certificates.Count+' registros originales; '+$publicData.certificates.Count+' fichas publicas verificadas; documentos publicos: '+$approvedFiles.Count)

& (Join-Path $PSScriptRoot 'Verificar-produccion.ps1') -Datos $Datos
