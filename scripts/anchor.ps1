param([string]$Invoice, [string]$Payer, [string]$Tx, [string]$Token = "0x20c0000000000000000000000000000000000000", [string]$Amount = "10000")
$REG = "0xC3FA070c45F1bDbA8871171F5c950f8C89c0fce1"
$RPC = "https://rpc.moderato.tempo.xyz"
$b = ([Environment]::GetFolderPath("MyDocuments") + "\Hackathon Projects\Colosseum\bursar")
$pk = [IO.File]::ReadAllText((Join-Path $b ".test-wallet"), [Text.Encoding]::UTF8).Trim()
# Usage: anchor.ps1 -Invoice <id> -Payer <addr> -Tx <hash> [-Token <addr>] [-Amount <int>]
$env:Path = "$env:USERPROFILE\.foundry\bin;" + $env:Path
cast send $REG "createInvoiceWithId(bytes32,address,address,uint256)" $Invoice $Payer $Token $Amount --rpc-url $RPC --private-key $pk --json 2>$null | ConvertFrom-Json | Select-Object transactionHash
cast send $REG "markPaid(bytes32,bytes32)" $Invoice $Tx --rpc-url $RPC --private-key $pk --json 2>$null | ConvertFrom-Json | Select-Object transactionHash
Write-Output "=== getInvoice:"; $st = cast call $REG "getInvoice(bytes32)" $Invoice --rpc-url $RPC 2>$null | Select-Object -Last 1; Write-Output $st.Substring($st.Length - 66)
