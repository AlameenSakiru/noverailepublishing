import prisma from "./prisma";

/**
 * Retrieves a platform configuration setting with priority:
 * 1. Persistent Neon PostgreSQL database (PlatformSetting table)
 * 2. Process Environment Variable (process.env)
 * 3. Default fallback value
 */
export async function getSettingValue(key: string, defaultValue = ""): Promise<string> {
  try {
    const record = await prisma.platformSetting.findUnique({
      where: { key },
    });
    if (record && record.value !== undefined && record.value !== "") {
      return record.value;
    }
  } catch (err) {
    // Database transient error fallback
  }
  return process.env[key] || defaultValue;
}

/**
 * Loads all platform settings stored in the database as a key-value dictionary.
 */
export async function getAllPlatformSettings(): Promise<Record<string, string>> {
  const settingsMap: Record<string, string> = {};
  try {
    const records = await prisma.platformSetting.findMany();
    for (const r of records) {
      settingsMap[r.key] = r.value;
    }
  } catch (err) {
    // Database transient error fallback
  }
  return settingsMap;
}

/**
 * Saves platform settings into the persistent database and updates in-memory environment.
 */
export async function savePlatformSettings(updates: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    try {
      await prisma.platformSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
      process.env[key] = String(value);
    } catch (err) {
      console.error(`❌ Failed to save setting [${key}] to database:`, err);
    }
  }
}
