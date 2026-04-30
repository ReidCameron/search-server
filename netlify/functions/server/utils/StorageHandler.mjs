import { getStore  } from "@netlify/blobs";

export class StorageHandler{
    static TOKEN_STORE = "tokens"

    #cache = { stores:{} };

    async get({store, key, opts}) {
        return this.#getCachedStore(store).get(key, { ...opts });
    }

    async set({store, key, value}){
        return this.#getCachedStore(store).setJSON(key, value);
    }

    #getCachedStore(storeName){
        return this.#cache.stores[storeName] ?? (
            this.#cache.stores[storeName] = {
                store: getStore(storeName),
                values: {},
                get: async function (key, opts){
                    return this.values[key] ?? (
                        this.values[key] = await this.store.get(key, opts)
                    )
                },
                setJSON: function(key, value){
                    this.values[key] = value;
                    return this.store.setJSON(key, value);
                }
            }
        );
    }
}