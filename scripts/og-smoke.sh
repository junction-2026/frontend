#!/usr/bin/env bash
# og-smoke.sh: builds the image, starts it next to a stub backend (scripts/og-stub-backend.mjs) and checks the
# link-preview tags that crawlers see (curl -A Twitterbot). Needs docker; not part of repo-ci.
# Usage: scripts/og-smoke.sh   (PUBLIC_ORIGIN defaults to https://veil.example)
set -euo pipefail
cd "$(dirname "$0")/.."
ORIGIN="${PUBLIC_ORIGIN:-https://veil.example}"
NET="og-smoke-$$"
cleanup() { docker rm -f "$NET-stub" "$NET-web" "$NET-warn" >/dev/null 2>&1 || true; docker network rm "$NET" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker build -q -t veil-frontend-og-smoke . >/dev/null
docker network create "$NET" >/dev/null
docker run -d --name "$NET-stub" --network "$NET" -v "$PWD/scripts/og-stub-backend.mjs:/stub.mjs:ro" node:22-alpine node /stub.mjs >/dev/null
docker run -d --name "$NET-web" --network "$NET" -p 127.0.0.1::80 \
  -e BACKEND_URL="http://$NET-stub:8080" -e PUBLIC_ORIGIN="$ORIGIN/" veil-frontend-og-smoke >/dev/null
PORT="$(docker port "$NET-web" 80/tcp | head -1 | sed 's/.*://')"
for _ in $(seq 30); do curl -fs -o /dev/null "http://127.0.0.1:$PORT/healthz" 2>/dev/null && break; curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break; sleep 0.5; done

fail=0
images=()   # every og:image / twitter:image URL seen by check()
# check <path> <expected substring>...: asserts HTTP 200, the SPA shell and every substring.
check() {
  local path="$1"; shift
  local out; out="$(curl -s -A Twitterbot -w '\n%{http_code}' "http://127.0.0.1:$PORT$path")"
  local code="${out##*$'\n'}" body="${out%$'\n'*}"
  [ "$code" = 200 ] || { echo "FAIL $path: HTTP $code"; fail=1; return; }
  for want in '<div id="root"></div>' 'name="twitter:card" content="summary_large_image"' 'property="og:image:width" content="1200"' "$@"; do
    grep -qF -- "$want" <<<"$body" || { echo "FAIL $path: missing $want"; fail=1; return; }
  done
  [ "$(grep -c 'og:start' <<<"$body")" = 1 ] || { echo "FAIL $path: card block duplicated"; fail=1; return; }
  ! grep -qE 'SECRET|0\.91|confidence' <<<"$body" || { echo "FAIL $path: leaked input or confidence"; fail=1; return; }
  while IFS= read -r u; do images+=("$u"); done < <(grep -oE '(property="og:image"|name="twitter:image") content="[^"]*"' <<<"$body" | sed 's/.*content="//; s/"$//')
  echo "ok   $path"
}
generic=("property=\"og:type\" content=\"website\"" "property=\"og:title\" content=\"VEIL / Intelligence\"" "property=\"og:image\" content=\"$ORIGIN/og/site.png\"")
check / "${generic[@]}" "property=\"og:url\" content=\"$ORIGIN/\""
check /jobs/detected 'property="og:type" content="article"' 'property="og:title" content="VEIL verdict: Manipulation detected"' \
  'Yes, propaganda detected. Loaded &lt;b&gt;language&lt;/b&gt; &amp; &quot;fear&quot; appeals.' "property=\"og:image\" content=\"$ORIGIN/og/verdict-detected.png\"" "property=\"og:url\" content=\"$ORIGIN/jobs/detected\""
check /jobs/detected/detail 'VEIL verdict: Manipulation detected'
check /jobs/running 'property="og:title" content="VEIL analysis in progress"' "$ORIGIN/og/pending.png"
check /jobs/big 'property="og:title" content="VEIL verdict: No manipulation indicators"' 'Big but fine.'   # 600 KB job: needs subrequest_output_buffer_size
check /jobs/huge 'property="og:title" content="VEIL verdict: Manipulation detected"' 'Huge but fine.'   # 5 MB job
check /jobs/failed 'property="og:title" content="VEIL analysis unavailable"' "$ORIGIN/og/unavailable.png"
check /jobs/unknown "${generic[@]}"
check '/jobs/bad%20id' "${generic[@]}"
check /jobs/boom "${generic[@]}"
check /jobs/slow "${generic[@]}"   # backend answers after 4 s: generic card after the 2 s timeout
check /history "${generic[@]}"
for img in site verdict-detected verdict-not_detected verdict-uncertain pending unavailable; do
  h="$(curl -sI "http://127.0.0.1:$PORT/og/$img.png")"
  grep -q '200' <<<"$(head -1 <<<"$h")" && grep -qi '^content-type: image/png' <<<"$h" && grep -qi '^cache-control: public, max-age=86400' <<<"$h" || { echo "FAIL /og/$img.png"; fail=1; }
done
# Favicon set and manifest: static files, never the SPA/njs HTML handler.
for f in favicon.ico favicon.svg apple-touch-icon.png icon-192.png icon-512.png site.webmanifest; do
  h="$(curl -sI "http://127.0.0.1:$PORT/$f")"
  { head -1 <<<"$h" | grep -q ' 200' && grep -qi '^content-type:' <<<"$h" && ! grep -qi '^content-type: *text/html' <<<"$h"; } || { echo "FAIL /$f"; fail=1; continue; }
  echo "ok   /$f"
done
curl -sI -A Twitterbot "http://127.0.0.1:$PORT/" | grep -qi '^cache-control: no-cache' || { echo "FAIL html cache-control"; fail=1; }

# og:image / twitter:image: each distinct URL starts with $ORIGIN/ and, fetched from the local container, is a 200 image/png.
while IFS= read -r u; do
  [ -n "$u" ] || continue
  [[ "$u" == "$ORIGIN/"* ]] || { echo "FAIL og:image $u (not under $ORIGIN/)"; fail=1; continue; }
  h="$(curl -sI "http://127.0.0.1:$PORT/${u#"$ORIGIN"/}")"
  { head -1 <<<"$h" | grep -q ' 200' && grep -qi '^content-type: image/png' <<<"$h"; } || { echo "FAIL og:image $u"; fail=1; continue; }
  echo "ok   og:image $u"
done < <(printf '%s\n' "${images[@]}" | sort -u)

# Startup check: a container without PUBLIC_ORIGIN (image default http://localhost) starts and warns; the main one does not.
docker run -d --name "$NET-warn" --network "$NET" -p 127.0.0.1::80 -e BACKEND_URL="http://$NET-stub:8080" veil-frontend-og-smoke >/dev/null
WPORT="$(docker port "$NET-warn" 80/tcp | head -1 | sed 's/.*://')"
for _ in $(seq 30); do curl -s -o /dev/null "http://127.0.0.1:$WPORT/" && break; sleep 0.5; done
curl -s -o /dev/null "http://127.0.0.1:$WPORT/" || { echo "FAIL default-origin container does not answer /"; fail=1; }
[ "$(docker logs "$NET-warn" 2>&1 | grep -c 'WARNING: PUBLIC_ORIGIN')" = 1 ] || { echo "FAIL default origin: expected one WARNING: PUBLIC_ORIGIN"; fail=1; }
! docker logs "$NET-web" 2>&1 | grep -q 'WARNING: PUBLIC_ORIGIN' || { echo "FAIL main container logged WARNING: PUBLIC_ORIGIN"; fail=1; }
exit $fail
