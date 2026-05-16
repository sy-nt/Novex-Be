export function resolveMergedValue<T>(
  key: string,
  merged: Record<string, unknown>,
  fallback?: T,
): T {
  if (Object.hasOwn(merged, key)) {
    return merged[key] as T;
  }

  const dotIndex = key.indexOf('.');
  if (dotIndex > 0) {
    const secretKey = key.slice(0, dotIndex);
    const fieldKey = key.slice(dotIndex + 1);
    const secretData = merged[secretKey];

    if (
      secretData !== null &&
      typeof secretData === 'object' &&
      Object.hasOwn(secretData, fieldKey)
    ) {
      return (secretData as Record<string, unknown>)[fieldKey] as T;
    }
  }

  return fallback as T;
}
