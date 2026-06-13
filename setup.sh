#!/bin/bash
echo "================================"
echo "  Void Notes - Installer"
echo "================================"
echo ""

echo "[1/3] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: npm install failed!"
    exit 1
fi
echo "[1/3] OK"
echo ""

echo "[2/3] Building..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed!"
    exit 1
fi
echo "[2/3] OK"
echo ""

echo "[3/3] Launching app..."
npm start
