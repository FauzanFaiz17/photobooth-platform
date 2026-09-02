export const storage = {
  async get<T = unknown>(key: string): Promise<T | null> {
    const value = await window.storage.get(key)
    return (value ?? null) as T | null
  },

  async set(key: string, value: unknown) {
    await window.storage.set(key, value)
  },

  async remove(key: string) {
    await window.storage.delete(key)
  }
}
