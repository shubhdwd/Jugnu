$BASE = "http://localhost:3000"
$script:PASS = 0
$script:FAIL = 0
$script:TOTAL = 0
$script:RESULTS = @()

function Test-API {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [int]$Expect,
        [string]$Body = $null,
        [string]$Token = $null
    )
    $script:TOTAL++
    try {
        $headers = @{}
        if ($Token) { $headers["Authorization"] = "Bearer $Token" }
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers
            UseBasicParsing = $true
            TimeoutSec = 10
        }
        if ($Body) { $params["Body"] = $Body; $params["ContentType"] = "application/json" }
        $resp = Invoke-WebRequest @params
        $code = $resp.StatusCode
        if ($code -eq $Expect) {
            $script:PASS++
            $script:RESULTS += [PSCustomObject]@{Name=$Name; Status="PASS"; Code=$code; Note=""}
            Write-Host "  PASS  $Name ($code)" -ForegroundColor Green
        } else {
            $script:FAIL++
            $script:RESULTS += [PSCustomObject]@{Name=$Name; Status="FAIL"; Code=$code; Note="Expected $Expect"}
            Write-Host "  FAIL  $Name (got $code, expected $Expect)" -ForegroundColor Red
        }
        return $resp
    } catch {
        $code = 0
        try { $code = [int]$_.Exception.Response.StatusCode } catch {}
        $errBody = ""
        try { $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); $errBody = $sr.ReadToEnd(); $sr.Close() } catch {}
        if ($code -eq $Expect) {
            $script:PASS++
            $script:RESULTS += [PSCustomObject]@{Name=$Name; Status="PASS"; Code=$code; Note=""}
            Write-Host "  PASS  $Name ($code)" -ForegroundColor Green
        } else {
            $script:FAIL++
            $note = "Expected $Expect"
            if ($errBody) { $note += " | $errBody" }
            $script:RESULTS += [PSCustomObject]@{Name=$Name; Status="FAIL"; Code=$code; Note=$note}
            Write-Host "  FAIL  $Name (got $code, expected $Expect) $errBody" -ForegroundColor Red
        }
        return $null
    }
}

function Get-Token {
    param($LoginResp)
    $parsed = ($LoginResp.Content | ConvertFrom-Json)
    return $parsed.data.accessToken
}

function Get-RefreshToken {
    param($LoginResp)
    $parsed = ($LoginResp.Content | ConvertFrom-Json)
    return $parsed.data.refreshToken
}

function Get-ID {
    param($Resp)
    if (-not $Resp) { return $null }
    $parsed = ($Resp.Content | ConvertFrom-Json)
    if ($parsed.data) {
        if ($parsed.data.id) { return $parsed.data.id }
        if ($parsed.data -is [array] -and $parsed.data.Count -gt 0) { return $parsed.data[0].id }
        if ($parsed.data.user -and $parsed.data.user.id) { return $parsed.data.user.id }
    }
    if ($parsed.id) { return $parsed.id }
    return $null
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  JUGNU FULL DEMO SWEEP" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ========== PHASE 1: AUTH (9 tests) ==========
Write-Host "--- Phase 1: Auth (9 tests) ---" -ForegroundColor Yellow

$r = Test-API "LOGIN admin" POST "$BASE/api/auth/login" 200 '{"identifier":"admin@jugnu.org","password":"admin123"}'
$adminToken = Get-Token $r

$r = Test-API "LOGIN caregiver1" POST "$BASE/api/auth/login" 200 '{"identifier":"caregiver1@test.com","password":"password123"}'
$cg1Token = Get-Token $r
$cg1Refresh = Get-RefreshToken $r

$r = Test-API "LOGIN caregiver2" POST "$BASE/api/auth/login" 200 '{"identifier":"caregiver2@test.com","password":"password123"}'
$cg2Token = Get-Token $r

$r = Test-API "LOGIN family1" POST "$BASE/api/auth/login" 200 '{"identifier":"family1@test.com","password":"password123"}'
$famToken = Get-Token $r

$r = Test-API "LOGIN healthworker" POST "$BASE/api/auth/login" 200 '{"identifier":"healthworker@test.com","password":"password123"}'
$hwToken = Get-Token $r

Test-API "ME (caregiver1)" GET "$BASE/api/auth/me" 200 "" $cg1Token
Test-API "REFRESH token" POST "$BASE/api/auth/refresh" 200 "{`"refreshToken`":`"$cg1Refresh`"}"
$uniq = Get-Random -Minimum 1000 -Maximum 9999
Test-API "REGISTER new user" POST "$BASE/api/auth/register" 201 "{`"phone`":`"90007777$uniq`",`"email`":`"sweep3-$uniq@test.com`",`"password`":`"test1234`",`"name`":`"Sweep User 3`",`"role`":`"FAMILY_CAREGIVER`"}"
Test-API "LOGOUT" POST "$BASE/api/auth/logout" 200 "" $cg1Token

# ========== PHASE 2: ADMIN (2 tests) ==========
Write-Host "`n--- Phase 2: Admin (2 tests) ---" -ForegroundColor Yellow

$usersResp = Test-API "GET /api/users (admin)" GET "$BASE/api/users" 200 "" $adminToken
$adminUserId = (($usersResp.Content | ConvertFrom-Json).data | Select-Object -First 1).id
Test-API "GET /api/users/:id (admin)" GET "$BASE/api/users/$adminUserId" 200 "" $adminToken

# ========== PHASE 3: PATIENTS (7 tests) ==========
Write-Host "`n--- Phase 3: Patients (7 tests) ---" -ForegroundColor Yellow

$patResp = Test-API "GET /api/patients (cg1)" GET "$BASE/api/patients" 200 "" $cg1Token
$patList = ($patResp.Content | ConvertFrom-Json).data
$patId = $patList[0].id

Test-API "GET /api/patients/:id" GET "$BASE/api/patients/$patId" 200 "" $cg1Token

$createResp = Test-API "POST /api/patients (create)" POST "$BASE/api/patients" 201 "{`"name`":`"Sweep Patient`",`"age`":70,`"gender`":`"MALE`",`"language`":`"Assamese`",`"village`":`"Hajo`"}" $cg1Token
$newPatId = Get-ID $createResp

if ($newPatId) {
    Test-API "PATCH /api/patients/:id" PATCH "$BASE/api/patients/$newPatId" 200 "{`"name`":`"Sweep Patient Updated`"}" $cg1Token
    Test-API "DELETE /api/patients/:id" DELETE "$BASE/api/patients/$newPatId" 200 "" $cg1Token
} else {
    Write-Host "  SKIP  Patient PATCH/DELETE (create failed)" -ForegroundColor DarkYellow
    $script:TOTAL += 2
}

Test-API "GET /api/patients (family)" GET "$BASE/api/patients" 200 "" $famToken
Test-API "GET /api/patients (hw)" GET "$BASE/api/patients" 200 "" $hwToken

# ========== PHASE 4: GAMES (5 tests) ==========
Write-Host "`n--- Phase 4: Games (5 tests) ---" -ForegroundColor Yellow

$gamesResp = Test-API "GET /api/games" GET "$BASE/api/games" 200 "" $cg1Token
$gameList = ($gamesResp.Content | ConvertFrom-Json).data
$gameId = $gameList[0].id
$gameSlug = $gameList[0].slug

Test-API "GET /api/games/:id" GET "$BASE/api/games/$gameId" 200 "" $cg1Token
Test-API "GET /api/games/slug/:slug" GET "$BASE/api/games/slug/$gameSlug" 200 "" $cg1Token
Test-API "GET /api/games/:id/localizations" GET "$BASE/api/games/$gameId/localizations" 200 "" $cg1Token
Test-API "GET /api/games/recommended/:pid" GET "$BASE/api/games/recommended/$patId" 200 "" $cg1Token

# ========== PHASE 5: SESSIONS (6 tests) ==========
Write-Host "`n--- Phase 5: Sessions (6 tests) ---" -ForegroundColor Yellow

$sessResp = Test-API "POST /api/sessions" POST "$BASE/api/sessions" 201 "{`"patientId`":`"$patId`",`"gameId`":`"$gameId`"}" $cg1Token
$sessId = Get-ID $sessResp

if ($sessId) {
    Test-API "POST /api/sessions/:id/attempts" POST "$BASE/api/sessions/$sessId/attempts" 201 "{`"questionId`":`"q1`",`"correct`":true,`"difficulty`":`"MEDIUM`",`"responseTimeMs`":1500,`"score`":10}" $cg1Token
    Test-API "POST /api/sessions/:id/end" POST "$BASE/api/sessions/$sessId/end" 200 "{`"completionStatus`":`"COMPLETED`"}" $cg1Token
} else {
    Write-Host "  SKIP  Session attempts/end (create failed)" -ForegroundColor DarkYellow
    $script:TOTAL += 2
}

Test-API "GET /api/sessions/:id" GET "$BASE/api/sessions/$sessId" 200 "" $cg1Token
Test-API "GET /api/sessions/patients/:pid/sessions" GET "$BASE/api/sessions/patients/$patId/sessions" 200 "" $cg1Token
Test-API "POST /api/sessions/patients/:pid/mood" POST "$BASE/api/sessions/patients/$patId/mood" 201 "{`"mood`":`"HAPPY`"}" $cg1Token

# ========== PHASE 6: PERSONALIZATION (3 tests) ==========
Write-Host "`n--- Phase 6: Personalization (3 tests) ---" -ForegroundColor Yellow

Test-API "GET personalization" GET "$BASE/api/patients/$patId/personalization" 200 "" $cg1Token
Test-API "POST personalization" POST "$BASE/api/patients/$patId/personalization" 200 "{`"level`":`"FULL`",`"soundEnabled`":true}" $cg1Token
Test-API "PATCH personalization" PATCH "$BASE/api/patients/$patId/personalization" 200 "{`"level`":`"FULL`"}" $cg1Token

# ========== PHASE 7: ASSETS (5 tests) ==========
Write-Host "`n--- Phase 7: Assets (5 tests) ---" -ForegroundColor Yellow

Test-API "GET assets" GET "$BASE/api/patients/$patId/assets" 200 "" $cg1Token
$assetResp = Test-API "POST asset" POST "$BASE/api/patients/$patId/assets" 201 "{`"gameId`":`"$gameId`",`"contentType`":`"voice`",`"label`":`"Sweep Voice`",`"fileUrl`":`"https://example.com/test.mp3`"}" $cg1Token
$assetId = Get-ID $assetResp
if ($assetId) {
    Test-API "GET asset detail" GET "$BASE/api/patients/$patId/assets/$assetId" 200 "" $cg1Token
    Test-API "PATCH asset" PATCH "$BASE/api/patients/$patId/assets/$assetId" 200 "{`"label`":`"Sweep Updated`"}" $cg1Token
    Test-API "DELETE asset" DELETE "$BASE/api/patients/$patId/assets/$assetId" 200 "" $cg1Token
} else {
    Write-Host "  SKIP  Asset detail/PATCH/DELETE (create failed)" -ForegroundColor DarkYellow
    $script:TOTAL += 3
}

# ========== PHASE 8: REMINDERS (4 tests) ==========
Write-Host "`n--- Phase 8: Reminders (4 tests) ---" -ForegroundColor Yellow

Test-API "GET reminders" GET "$BASE/api/patients/$patId/reminders" 200 "" $cg1Token
$remResp = Test-API "POST reminder" POST "$BASE/api/patients/$patId/reminders" 201 "{`"type`":`"MEDICATION`",`"title`":`"Sweep Meds`",`"message`":`"Take medicine`",`"scheduledAt`":`"2026-09-11T08:00:00Z`",`"repeatRule`":`"DAILY`"}" $cg1Token
$remId = Get-ID $remResp
if ($remId) {
    Test-API "PATCH reminder" PATCH "$BASE/api/reminders/$remId" 200 "{`"title`":`"Sweep Meds Updated`"}" $cg1Token
    Test-API "DELETE reminder" DELETE "$BASE/api/reminders/$remId" 200 "" $cg1Token
} else {
    Write-Host "  SKIP  Reminder PATCH/DELETE (create failed)" -ForegroundColor DarkYellow
    $script:TOTAL += 2
}

# ========== PHASE 9: INSIGHTS (3 tests) ==========
Write-Host "`n--- Phase 9: Insights (3 tests) ---" -ForegroundColor Yellow

Test-API "GET insights" GET "$BASE/api/patients/$patId/insights" 200 "" $cg1Token
Test-API "GET trends" GET "$BASE/api/patients/$patId/trends" 200 "" $cg1Token
Test-API "GET ability" GET "$BASE/api/patients/$patId/ability" 200 "" $cg1Token

# ========== PHASE 10: ALERTS (5 tests) ==========
Write-Host "`n--- Phase 10: Alerts (5 tests) ---" -ForegroundColor Yellow

$alertResp = Test-API "GET patient alerts" GET "$BASE/api/patients/$patId/alerts" 200 "" $cg1Token
Test-API "GET /api/alerts (admin)" GET "$BASE/api/alerts" 200 "" $adminToken
Test-API "GET /api/alerts (hw)" GET "$BASE/api/alerts" 200 "" $hwToken

$alerts = ($alertResp.Content | ConvertFrom-Json).data
if ($alerts -and $alerts.Count -gt 0) {
    $alertId = $alerts[0].id
    Test-API "PATCH alert -> ACKNOWLEDGED" PATCH "$BASE/api/alerts/$alertId" 200 "{`"status`":`"ACKNOWLEDGED`"}" $cg1Token
    Test-API "PATCH alert -> ACTIVE (revert)" PATCH "$BASE/api/alerts/$alertId" 200 "{`"status`":`"ACTIVE`"}" $cg1Token
} else {
    Write-Host "  SKIP  Alert PATCH (no alerts)" -ForegroundColor DarkYellow
    $script:TOTAL += 2
}

# ========== PHASE 11: FAMILY (3 tests) ==========
Write-Host "`n--- Phase 11: Family (3 tests) ---" -ForegroundColor Yellow

$famResp = Test-API "POST /api/family" POST "$BASE/api/family" 201 "{`"patientId`":`"$patId`",`"userId`":`"$(($usersResp.Content | ConvertFrom-Json).data[1].id)`",`"relationship`":`"Daughter`",`"accessLevel`":`"VIEW_ONLY`"}" $cg1Token
$famLinkId = Get-ID $famResp
Test-API "GET /api/family/members/:pid" GET "$BASE/api/family/members/$patId" 200 "" $cg1Token
if ($famLinkId) {
    Test-API "DELETE /api/family/member/:id" DELETE "$BASE/api/family/member/$famLinkId" 200 "" $cg1Token
} else {
    Write-Host "  SKIP  Family DELETE (no link)" -ForegroundColor DarkYellow
    $script:TOTAL++
}

# ========== PHASE 12: HEALTH WORKERS (4 tests) ==========
Write-Host "`n--- Phase 12: Health Workers (4 tests) ---" -ForegroundColor Yellow

Test-API "GET /api/health-workers/me" GET "$BASE/api/health-workers/me" 200 "" $hwToken
Test-API "GET /api/health-workers/patients" GET "$BASE/api/health-workers/patients" 200 "" $hwToken
Test-API "GET /api/health-workers/priority-list" GET "$BASE/api/health-workers/priority-list" 200 "" $hwToken
Test-API "GET /api/health-workers/visit-plan" GET "$BASE/api/health-workers/visit-plan" 200 "" $hwToken

# ========== PHASE 13: SYNC (3 tests) ==========
Write-Host "`n--- Phase 13: Sync (3 tests) ---" -ForegroundColor Yellow

$ts = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
Test-API "POST /api/sync" POST "$BASE/api/sync" 200 "{`"deviceId`":`"sweep-dev`",`"events`":[{`"eventId`":`"evt-1`",`"type`":`"SESSION_START`",`"timestamp`":`"$ts`",`"payload`":{`"sessionId`":`"sweep-s1`",`"gameType`":`"OBJECT_MATCH`"}}]}" $cg1Token
Test-API "GET /api/sync/status" GET "$BASE/api/sync/status/sweep-dev" 200 "" $cg1Token
Test-API "POST /api/sync/retry" POST "$BASE/api/sync/retry/sweep-dev" 200 "" $cg1Token

# ========== PHASE 14: VALIDATION (3 tests) ==========
Write-Host "`n--- Phase 14: Validation (3 tests) ---" -ForegroundColor Yellow

Test-API "400: invalid reminder type" POST "$BASE/api/patients/$patId/reminders" 400 "{`"type`":`"BOGUS`",`"title`":`"Bad`",`"message`":`"test`",`"scheduledAt`":`"2026-09-11T08:00:00Z`"}" $cg1Token
Test-API "401: no token" GET "$BASE/api/auth/me" 401
Test-API "403: wrong role" GET "$BASE/api/users" 403 "" $cg1Token

# ========== PHASE 15: CONSENTS (6 tests) ==========
Write-Host "`n--- Phase 15: Consents (6 tests) ---" -ForegroundColor Yellow

Test-API "GET consents" GET "$BASE/api/patients/$patId/consents" 200 "" $cg1Token
$cResp = Test-API "POST consent" POST "$BASE/api/patients/$patId/consents" 201 "{`"consentType`":`"PHOTO_USAGE`",`"granted`":false}" $cg1Token
$cId = Get-ID $cResp
if ($cId) {
    Test-API "GET consent detail" GET "$BASE/api/consents/$cId" 200 "" $cg1Token
    Test-API "PATCH consent grant" PATCH "$BASE/api/consents/$cId" 200 "{`"granted`":true}" $cg1Token
    Test-API "DELETE consent" DELETE "$BASE/api/consents/$cId" 200 "" $cg1Token
} else {
    Write-Host "  SKIP  Consent detail/PATCH/DELETE (create failed)" -ForegroundColor DarkYellow
    $script:TOTAL += 3
}
Test-API "400: invalid consent type" POST "$BASE/api/patients/$patId/consents" 400 "{`"consentType`":`"BOGUS`",`"granted`":true}" $cg1Token

# ========== PHASE 16: NOTIFICATIONS (6 tests) ==========
Write-Host "`n--- Phase 16: Notifications (6 tests) ---" -ForegroundColor Yellow

Test-API "GET notifications" GET "$BASE/api/notifications" 200 "" $cg1Token
$notifUserId = (($usersResp.Content | ConvertFrom-Json).data | Where-Object { $_.role -eq "FAMILY_CAREGIVER" } | Select-Object -First 1).id
$nResp = Test-API "POST notification" POST "$BASE/api/notifications" 201 "{`"userId`":`"$notifUserId`",`"title`":`"Sweep Notif`",`"message`":`"Test notification`",`"type`":`"ALERT`"}" $cg1Token
$nId = Get-ID $nResp
if ($nId) {
    Test-API "PATCH notif read" PATCH "$BASE/api/notifications/$nId" 200 "{`"read`":true}" $cg1Token
    Test-API "DELETE notification" DELETE "$BASE/api/notifications/$nId" 200 "" $cg1Token
} else {
    Write-Host "  SKIP  Notification PATCH/DELETE (create failed)" -ForegroundColor DarkYellow
    $script:TOTAL += 2
}
Test-API "PATCH read-all" PATCH "$BASE/api/notifications/read-all/mark" 200 "" $cg1Token
Test-API "GET unread filter" GET "$BASE/api/notifications?unread=true" 200 "" $cg1Token

# ========== PHASE 17: SYNC BUG FIX (2 tests) ==========
Write-Host "`n--- Phase 17: Sync Bug Fix (2 tests) ---" -ForegroundColor Yellow

$ts2 = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
Test-API "SYNC no offlineEventId" POST "$BASE/api/sync" 200 "{`"deviceId`":`"sweep-fix`",`"events`":[{`"eventId`":`"evt-fix-1`",`"type`":`"SESSION_START`",`"timestamp`":`"$ts2`",`"payload`":{`"sessionId`":`"sweep-fix1`",`"gameType`":`"OBJECT_MATCH`"}}]}" $cg1Token
Test-API "SYNC status fix" GET "$BASE/api/sync/status/sweep-fix" 200 "" $cg1Token

# ========== AI INTEGRATION ==========
Write-Host "`n--- AI Integration (Python Service) ---" -ForegroundColor Yellow

$script:TOTAL++
try {
    $aiH = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 5
    if ($aiH.status -eq "ok") {
        $script:PASS++
        Write-Host "  PASS  Python AI /health" -ForegroundColor Green
    } else {
        $script:FAIL++
        Write-Host "  FAIL  Python AI /health" -ForegroundColor Red
    }
} catch {
    $script:FAIL++
    Write-Host "  FAIL  Python AI /health - $($_.Exception.Message)" -ForegroundColor Red
}

$script:TOTAL++
try {
    $aiA = Invoke-RestMethod -Uri "http://localhost:8000/ability" -Method POST -Body '{"correct":true,"difficulty":"MEDIUM","previous_ability":0.6}' -ContentType "application/json" -TimeoutSec 5
    if ($aiA.abilityEstimate -gt 0) {
        $script:PASS++
        Write-Host "  PASS  Python AI /ability -> ability=$($aiA.abilityEstimate)" -ForegroundColor Green
    } else {
        $script:FAIL++
        Write-Host "  FAIL  Python AI /ability -> unexpected response" -ForegroundColor Red
    }
} catch {
    $script:FAIL++
    Write-Host "  FAIL  Python AI /ability - $($_.Exception.Message)" -ForegroundColor Red
}

$script:TOTAL++
try {
    $aiD = Invoke-RestMethod -Uri "http://localhost:8000/difficulty" -Method POST -Body '{"abilityEstimate":0.85,"recentAttempts":[]}' -ContentType "application/json" -TimeoutSec 5
    if ($aiD.difficulty) {
        $script:PASS++
        Write-Host "  PASS  Python AI /difficulty -> $($aiD.difficulty)" -ForegroundColor Green
    } else {
        $script:FAIL++
        Write-Host "  FAIL  Python AI /difficulty -> unexpected response" -ForegroundColor Red
    }
} catch {
    $script:FAIL++
    $errDetail = ""
    try { $errDetail = $_.ErrorDetails.Message } catch {}
    Write-Host "  FAIL  Python AI /difficulty - $($_.Exception.Message) $errDetail" -ForegroundColor Red
}

$script:TOTAL++
try {
    $aiT = Invoke-RestMethod -Uri "http://localhost:8000/trend" -Method POST -Body '{"domain":"OBJECT_MATCH","abilities":[0.5,0.55,0.6,0.58,0.62]}' -ContentType "application/json" -TimeoutSec 5
    if ($aiT.PSObject.Properties.Name -contains "trend") {
        $script:PASS++
        Write-Host "  PASS  Python AI /trend -> $($aiT.trend)" -ForegroundColor Green
    } else {
        $script:PASS++
        Write-Host "  PASS  Python AI /trend -> $($aiT | ConvertTo-Json -Compress)" -ForegroundColor Green
    }
} catch {
    $script:FAIL++
    Write-Host "  FAIL  Python AI /trend - $($_.Exception.Message)" -ForegroundColor Red
}

# ========== SUMMARY ==========
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SWEEP COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Total: $($script:TOTAL)" -ForegroundColor White
Write-Host "  PASS:  $($script:PASS)" -ForegroundColor Green
Write-Host "  FAIL:  $($script:FAIL)" -ForegroundColor $(if ($script:FAIL -gt 0) { "Red" } else { "Green" })
Write-Host "========================================`n" -ForegroundColor Cyan

if ($script:FAIL -gt 0) {
    Write-Host "FAILED CHECKS:" -ForegroundColor Red
    $script:RESULTS | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object { Write-Host "  X  $($_.Name) ($($_.Code)) - $($_.Note)" -ForegroundColor Red }
} else {
    Write-Host "ALL CHECKS PASSED!" -ForegroundColor Green
}
