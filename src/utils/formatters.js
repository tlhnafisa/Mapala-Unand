/**
 * Mengubah string menjadi Title Case (huruf kapital di awal setiap kata).
 * @param {string} str
 * @returns {string}
 */
function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

module.exports = {
  toTitleCase
};
