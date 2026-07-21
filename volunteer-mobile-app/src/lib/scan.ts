export const normalizeScanValue = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith("EP1:")) {
    const [, registrationId] = trimmed.split(":");
    return registrationId?.trim().toUpperCase() ?? trimmed.toUpperCase();
  }
  return trimmed.toUpperCase();
};
