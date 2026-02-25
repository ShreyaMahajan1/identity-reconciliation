#!/bin/bash

echo "=== Test 1: First purchase (lorraine) ==="
curl -s -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"lorraine@hillvalley.edu","phoneNumber":"123456"}' | python3 -m json.tool

echo -e "\n=== Test 2: Same customer, new email (mcfly) ==="
curl -s -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"mcfly@hillvalley.edu","phoneNumber":"123456"}' | python3 -m json.tool

echo -e "\n=== Test 3: Query with just email ==="
curl -s -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"lorraine@hillvalley.edu"}' | python3 -m json.tool

echo -e "\n=== Test 4: Query with just phone ==="
curl -s -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"123456"}' | python3 -m json.tool
