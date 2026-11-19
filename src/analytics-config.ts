export const analyticsStorageKey = 'local-lift-analytics';

export function analyticsConfig(gtmId?: string, measurementId?: string) {
  const id = measurementId?.trim() || '';
  const containerId = (gtmId ?? 'GTM-PG38VX8P').trim();
  const useGtm = /^GTM-[A-Z0-9]+$/.test(containerId);
  const validMeasurementId = /^G-[A-Z0-9]{6,15}$/.test(id);
  return { id, containerId, useGtm, validMeasurementId, configured: useGtm || validMeasurementId };
}
