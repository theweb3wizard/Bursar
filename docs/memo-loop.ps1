$env:Path = "$env:USERPROFILE\.foundry\bin;" + $env:Path
$b = ([Environment]::GetFolderPath("MyDocuments") + "\Hackathon Projects\Colosseum\bursar")
$pk = [IO.File]::ReadAllText((Join-Path $b ".test-wallet"), [Text.Encoding]::UTF8).Trim()
$REG = "0xe138ED601fb64181cF38987a13bfbC94Fcf51066"
$RPC = "https://rpc.moderato.tempo.xyz"
$ME = "0xC7dC24FCa0b55721b8A2b6543702Be289aA2F261"
$TOKEN = "0x20c0000000000000000000000000000000000000"
$pass = 0
for ($i = 1; $i -le 9; $i++) {
  $amt = 10000 + $i
  try {
    $ID = (cast call $REG "createInvoice(address,address,uint256)" $ME $TOKEN $amt --rpc-url $RPC --from $ME 2>$null | Select-Object -Last 1).Trim()
    cast send $REG "createInvoice(address,address,uint256)" $ME $TOKEN $amt --rpc-url $RPC --private-key $pk --json 2>$null | Out-Null
    $payOut = cast send $TOKEN "transferWithMemo(address,uint256,bytes32)" $ME $amt $ID --rpc-url $RPC --private-key $pk --json 2>$null | ConvertFrom-Json
    $PAY = $payOut.transactionHash
    cast send $REG "markPaid(bytes32,bytes32)" $ID $PAY --rpc-url $RPC --private-key $pk --json 2>$null | Out-Null
    $st = (cast call $REG "getInvoice(bytes32)" $ID --rpc-url $RPC 2>$null | Select-Object -Last 1).Trim()
    if ($st.EndsWith("02")) { $pass++; Write-Output "round $i PASS ($ID)" }
    else { Write-Output "round $i FAIL-status ($ID)" }
  } catch { Write-Output "round $i ERROR: $($_.Exception.Message)" }
}
Write-Output "RESULT: $pass/9 passed (plus 1 manual = $($pass + 1)/10 total)"
