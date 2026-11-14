#!/bin/sh
# Startup hook run by the stock nginx entrypoint (/docker-entrypoint.d) before nginx starts.
# Warns on stderr when PUBLIC_ORIGIN is unset, empty, not an absolute http(s) origin or a loopback host,
# because og:url/og:image use it and crawlers cannot fetch preview images from there. Always exits 0.
v="${PUBLIC_ORIGIN-}"
o="${v%/}"
ok=
case "$o" in
  *[[:space:]]*) ;;
  *) if printf '%s\n' "$o" | grep -Eq '^https?://([^[:space:]/?#@:[]+|\[[^][:space:]/?#@]+\])(:[0-9]+)?$'; then
       h="${o#*://}"
       case "$h" in '['*) h="${h%%]*}]" ;; *) h="${h%%:*}" ;; esac
       case "$(printf '%s' "$h" | tr 'A-Z' 'a-z')" in localhost|127.0.0.1|'[::1]'|0.0.0.0) ;; *) ok=1 ;; esac
     fi ;;
esac
if [ -z "$ok" ]; then
  shown="$(printf '%s' "$v" | tr '\n\r' '  ')"
  echo "WARNING: PUBLIC_ORIGIN=\"$shown\" is unset, not an absolute http(s) origin or a loopback host. og:url and og:image use this value, so crawlers (Discord, Slack, Twitter) cannot fetch the link-preview images. Set PUBLIC_ORIGIN to the public scheme://host[:port], e.g. https://veil.example" >&2
fi
exit 0
