$bytes = [System.IO.File]::ReadAllBytes("d:\data axl\AI-Powered Research & Innovation Copilot.pdf")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$pattern = '(?<=\()([^\)]{3,})(?=\))'
$results = [regex]::Matches($text, $pattern)
foreach ($m in $results) {
    Write-Output $m.Value
}
