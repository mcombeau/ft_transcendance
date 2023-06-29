echo "[Configure frontend] Setting PORT 3000..."
echo "PORT=3000" > .env
echo "[Configure frontend] Creating react app..."
npx create-react-app ./ --template typescript
echo "[Configure frontend] Installing requirements..."
npm install
# Uncomment build rule for production
# echo "[Configure frontend] Building app..."
# npm build
echo "[Configure frontend] Starting frontend app..."
npm start
