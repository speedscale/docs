#!/usr/bin/env bash
# This script is a workaround for https://github.com/actions/runner/issues/1019; can't have the colons in YAML

PR=$1
SED_OPTS="-i"
SCRIPT_DIR=$(dirname -- "${BASH_SOURCE[0]}")

if [ $(uname) == "Darwin" ];
then
    SED_OPTS+=" ''"
fi

sed ${SED_OPTS} "s|baseUrl: \"/\"|baseUrl: \"/pr-${1}\"|g" ${SCRIPT_DIR}/../docusaurus.config.js
