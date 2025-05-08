#!/bin/bash

# Token khass ykoun kayn f Cookie, wla t9der tkhdmo mn login
curl -X POST http://localhost:8080/logout \
  -H "Cookie: session_token=36PZpam928Nm_cGSmDX8NmvU8gYD_U2iAW7Ikj-xFKQ="
