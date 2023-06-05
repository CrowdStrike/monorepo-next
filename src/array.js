'use strict';

function sortByString(array, callback) {
  return array.sort((a, b) => {
    a = callback(a);
    b = callback(b);

    if (a < b)
      return -1;
    if (a > b)
      return 1;
    return 0;
  });
}

function mapByIndex(array, index) {
  return array.map(item => item[index]);
}

module.exports = {
  sortByString,
  mapByIndex,
};
