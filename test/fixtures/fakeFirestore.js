function createFakeFirestore() {
    const docs = new Map();

    function collection(name) {
        return {
            doc(id) {
                const key = `${name}/${id}`;
                return {
                    async get() {
                        if (!docs.has(key)) {
                            return { exists: false, data: () => undefined };
                        }
                        return { exists: true, data: () => docs.get(key) };
                    },
                    async set(value) {
                        docs.set(key, { ...value });
                    },
                    async update(patch) {
                        const current = docs.get(key);
                        if (!current) {
                            const error = new Error("document missing");
                            error.statusCode = 404;
                            throw error;
                        }
                        docs.set(key, { ...current, ...patch });
                    }
                };
            }
        };
    }

    return {
        collection,
        read(name, id) {
            return docs.get(`${name}/${id}`);
        }
    };
}

module.exports = { createFakeFirestore };
