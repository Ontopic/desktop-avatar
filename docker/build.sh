#!/bin/bash
set -e
VERSION=$(cat ../package.json | grep '^[\t ]*"version"[ \t]*:' | sed 's/.*"version".*"\(.*\)",/\1/')

function show_help() {
  echo ./build.sh [docker]
}

function copy_code() {
  rm -rf src
  mkdir src
  cd src

  echo copying main code
  cp ../../*js .

  rm index.js
  rm wins.js
  rm preload-*.js
  rm dbg.js

  echo patching...
  patch < ../plugins-patch


  echo copying store reducer
  mkdir web
  cp ../../web/store.js ./web/

  echo copying avatar engine code
  mkdir web/engine
  cp ../../web/engine/*js ./web/engine/

  echo setting docker specific code..
  cp ../index.js .
  cp ../chat.js .
  cp ../settings.js .
  cp ../login.js .
  cp ../ww.js ./web/engine/

  cd ..
}

function build_docker() {
  copy_code

  docker build . -t desktop-avatar:latest
  docker tag desktop-avatar:latest desktop-avatar:$VERSION
  docker tag desktop-avatar:latest salesboxai/desktop-avatar:$VERSION
  docker tag desktop-avatar:latest salesboxai/desktop-avatar:latest
}




SWITCH=$1
if [ -z "$SWITCH" ]
then
  SWITCH="copy"
fi

case "$SWITCH" in
"-h" | "--help" | "help")
  show_help
  ;;
"docker")
  build_docker
  ;;
"copy")
  copy_code
  ;;
*)
  show_help
  ;;
esac
