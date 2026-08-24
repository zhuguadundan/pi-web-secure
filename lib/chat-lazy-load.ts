// Desktop users typically have more screen space and faster devices
export const VISIBLE_PAGE_SIZE = 150;
export const PAGING_PAGE_SIZE = 50;
export const MOBILE_PAGE_SIZE = 50;

export function getVisibleRenderWindow(totalCount: number, visibleCount: number): {
  startIndex: number;
  hasMore: boolean;
} {
  const clampedVisibleCount = Math.min(Math.max(visibleCount, 0), Math.max(totalCount, 0));
  const startIndex = Math.max(0, totalCount - clampedVisibleCount);
  return { startIndex, hasMore: startIndex > 0 };
}

export function getNextVisibleCount(currentVisibleCount: number, pageSize = PAGING_PAGE_SIZE): number {
  return currentVisibleCount + pageSize;
}

export function getInitialPageSize(isMobile: boolean): number {
  return isMobile ? MOBILE_PAGE_SIZE : VISIBLE_PAGE_SIZE;
}

export function captureScrollDistance(scrollHeight: number, scrollTop: number): number {
  return scrollHeight - scrollTop;
}

export function restoreScrollTop(scrollHeight: number, savedDistance: number): number {
  return Math.max(0, scrollHeight - savedDistance);
}
