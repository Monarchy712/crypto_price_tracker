document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");

  const coinName = document.getElementById("coinName");
  const coinSymbol = document.getElementById("coinSymbol");
  const coinImage = document.getElementById("coinImage");
  const coinPrice = document.getElementById("coinPrice");
  const coinChange = document.getElementById("coinChange");
  const coinMarketCap = document.getElementById("coinMarketCap");

  let priceChart = null;

  /* Format large numbers */
  function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    return num.toLocaleString();
  }

  async function fetchCrypto(query) {
    try {
      // Search coin ID
      const searchRes = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${query}`
      );
      const searchData = await searchRes.json();
      if (!searchData.coins.length) throw new Error("Not found");

      const coinId = searchData.coins[0].id;

      // Fetch market data
      const marketRes = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}`
      );
      const [coin] = await marketRes.json();

      renderCoin(coin);
      fetchChartData(coinId);
    } catch (err) {
      console.error("Coin not found");
    }
  }

  /* Update UI */
  function renderCoin(coin) {
    coinName.textContent = coin.name;
    coinSymbol.textContent = coin.symbol.toUpperCase();
    coinImage.src = coin.image;

    coinPrice.textContent = `$${coin.current_price.toLocaleString()}`;

    const change = coin.price_change_percentage_24h;
    coinChange.textContent = `${change.toFixed(2)}%`;
    coinChange.className = change >= 0 ? "positive" : "negative";

    coinMarketCap.textContent = `$${formatNumber(coin.market_cap)}`;
  }

  /* Fetch 7-day chart data */
  async function fetchChartData(coinId) {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7`
    );
    const data = await res.json();

    // 🔥 Downsample to ~12 points
    const step = Math.ceil(data.prices.length / 12);
    const filtered = data.prices.filter((_, i) => i % step === 0);

    const prices = filtered.map(p => p[1]);
    const labels = filtered.map(p =>
      new Date(p[0]).toLocaleDateString()
    );

    renderChart(prices, labels);
  }

  /* Render chart */
  function renderChart(prices, labels) {
    const ctx = document.getElementById("priceChart");

    if (priceChart) priceChart.destroy();

    priceChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          data: prices,
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: "rgba(255,255,255,0.06)" } }
        }
      }
    });
  }

  /* Search on Enter */
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && searchInput.value.trim()) {
      fetchCrypto(searchInput.value.trim());
    }
  });
});
