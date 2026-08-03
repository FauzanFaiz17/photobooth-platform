export const storage = {

    async get(key: string) {
        return await window.storage.get(key);
    },

    async set(key: string, value: unknown) {
        await window.storage.set(key, value);
    },

    async remove(key: string) {
        await window.storage.delete(key);
    }

};