export const formatNumber = (n: number): string =>
  new Intl.NumberFormat("en-US").format(n);
