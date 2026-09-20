export function isNearScrollBottom(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  thresholdPx = 80,
): boolean {
  return scrollHeight - scrollTop - clientHeight <= thresholdPx;
}
