# Market Terminal Frontend

Frontend interactivo estilo **TradingView** desarrollado con **React 19**, **TypeScript**, **Vite** y **Lightweight Charts v5**.

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar servidor de desarrollo
```bash
npm run dev
```

Por defecto, la aplicación estará disponible en `http://localhost:5173`.

### 3. Compilar para producción
```bash
npm run build
```

---

## ⚙️ Configuración de Conexión

Por defecto, el frontend se comunica con la API en `http://localhost:8000/api/v1`.

Si necesitas personalizar la URL del backend, crea un archivo `.env` en `frontend/`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 🎯 Características Implementadas

- **Gráficos de Velas Japonesas (TradingView Lightweight Charts)**:
  - Velas OHLCV con colores personalizables (verde esmeralda / rojo carmesí).
  - Histograma de volumen integrado en el fondo.
  - Leyenda flotante interactiva con Open, High, Low, Close, Volume y variación %.
- **Barra de Temporalidades**: `1m`, `5m`, `15m`, `1h`, `4h`, `1D`, `1W`.
- **Buscador Rápido de Símbolos**: Modal con búsqueda en tiempo real y navegación por teclado (Enter, Esc, flechas).
- **Subpanel Inferior de Funding Rates**: Gráfico de área sincronizado con el histórico de tasa de fondeo y APR estimado.
- **Watchlist Lateral**: Filtros por activos (`Crypto`, `Stocks`, `Todos`) con cambio de par instantáneo.
- **Funding Scanner**: Vista de mercado completa para comparar mayores oportunidades de tasas positivas y negativas.
