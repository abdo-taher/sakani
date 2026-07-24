export const numbersOnly = {
  onKeyDown: (e) => {
    if (
      e.key.length === 1 &&
      !/[0-9]/.test(e.key) &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
    }
  },
  onPaste: (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    document.execCommand("insertText", false, text);
  },
};
