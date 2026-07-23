async function loadFromStorage() {
  try {
    const res = await window.storage.get("properties", true);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {
    /* not found or first run */
  }
  return null;
}
async function saveToStorage(list) {
  try {
    await window.storage.set("properties", JSON.stringify(list), true);
  } catch (e) {
    console.error("storage save failed", e);
  }
}

/* المفضلة (خاصة بكل مستخدم) */
async function loadFavorites() {
  try {
    const res = await window.storage.get("favorites", false);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {
    /* not found or first run */
  }
  return [];
}
async function saveFavorites(list) {
  try {
    await window.storage.set("favorites", JSON.stringify(list), false);
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