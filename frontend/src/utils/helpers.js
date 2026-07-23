const SAMPLE_IMG = (seed) => `https://picsum.photos/seed/${seed}/600/420`;
function fmtPrice(n) {
  return new Intl.NumberFormat("ar-EG").format(n) + " ج.م";
}

export {
  SAMPLE_IMG,
  fmtPrice
};