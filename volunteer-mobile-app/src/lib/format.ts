export const shortDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

export const shortDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium"
  }).format(new Date(value));

export const normalizeRegistrationId = (value: string) => value.trim().toUpperCase();
