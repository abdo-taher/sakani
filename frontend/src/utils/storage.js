async function loadFromStorage() {
  try {
    const raw = localStorage.getItem("properties");
    if (raw) return JSON.parse(raw);
  } catch (e) { /* not found or first run */ }
  return null;
}

async function saveToStorage(list) {
  try {
    localStorage.setItem("properties", JSON.stringify(list));
  } catch (e) {
    console.error("storage save failed", e);
  }
}

/* المفضلة (خاصة بكل مستخدم) */
async function loadFavorites() {
  try {
    const raw = localStorage.getItem("favorites");
    if (raw) return JSON.parse(raw);
  } catch (e) { /* not found or first run */ }
  return [];
}

async function saveFavorites(list) {
  try {
    localStorage.setItem("favorites", JSON.stringify(list));
  } catch (e) {
    console.error("favorites save failed", e);
  }
}

export {
  loadFromStorage,
  saveToStorage,
  loadFavorites,
  saveFavorites
};
