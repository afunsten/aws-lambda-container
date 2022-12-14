#!/bin/sh
# Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
echo "$0 $1 $2" 1>&2
echo "$@"

if [ $# -ne 1 ]; then
  echo "entrypoint requires the handler name to be the first argument" 1>&2
  exit 142
fi
export _HANDLER="$1"

RUNTIME_ENTRYPOINT=/var/runtime/bootstrap
if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
  echo "AWS_ACCESS_KEY_ID:$AWS_ACCESS_KEY_ID";

  exec /usr/local/bin/aws-lambda-rie $RUNTIME_ENTRYPOINT
else
  exec $RUNTIME_ENTRYPOINT "$@"
fi
