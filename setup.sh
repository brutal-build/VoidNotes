#!/bin/bash
echo "================================"
echo "  Void Notes - Instalator"
echo "================================"
echo ""

echo "[1/3] Instalowanie zależności..."
npm install
if [ $? -ne 0 ]; then
    echo "BŁĄD: npm install nie powiodło się!"
    exit 1
fi
echo "[1/3] OK"
echo ""

echo "[2/3] Kompilacja..."
npm run build
if [ $? -ne 0 ]; then
    echo "BŁĄD: Kompilacja nie powiodła się!"
    exit 1
fi
echo "[2/3] OK"
echo ""

echo "[3/3] Uruchamianie aplikacji..."
npm start
