#!/bin/sh
# Patch node_modules/.bin/next to inject --webpack for `next dev`
# so that `npx next dev` uses webpack instead of Turbopack.
# Turbopack requires native binaries not available on all platforms.

NEXT_BIN="node_modules/.bin/next"

cat > "$NEXT_BIN" << 'EOF'
#!/bin/sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")

case `uname` in
    *CYGWIN*|*MINGW*|*MSYS*)
        if command -v cygpath > /dev/null 2>&1; then
            basedir=`cygpath -w "$basedir"`
        fi
    ;;
esac

if [ "$1" = "dev" ]; then
  shift
  if [ -x "$basedir/node" ]; then
    exec "$basedir/node" "$basedir/../next/dist/bin/next" dev --webpack "$@"
  else
    exec node "$basedir/../next/dist/bin/next" dev --webpack "$@"
  fi
fi

if [ -x "$basedir/node" ]; then
  exec "$basedir/node" "$basedir/../next/dist/bin/next" "$@"
else
  exec node "$basedir/../next/dist/bin/next" "$@"
fi
EOF

chmod +x "$NEXT_BIN"
echo "✓ Patched node_modules/.bin/next to use --webpack for dev"
