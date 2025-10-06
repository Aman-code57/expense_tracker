export function formatIndianCurrency(num) {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  let str = num.toString();
  let [intPart, decPart] = str.split('.');
  decPart = decPart ? decPart.padEnd(2, '0').slice(0, 2) : '00';
  let lastThree = intPart.slice(-3);
  let other = intPart.slice(0, -3);
  if (other) {
    other = other.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return other + ',' + lastThree + '.' + decPart;
  } else {
    return lastThree + '.' + decPart;
  }
}
