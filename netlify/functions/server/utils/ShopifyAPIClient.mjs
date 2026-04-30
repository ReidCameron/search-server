
import { createAdminApiClient } from "@shopify/admin-api-client";
import { createStorefrontApiClient } from "@shopify/storefront-api-client";
import { StorageHandler } from './StorageHandler.mjs';
import dotenv from 'dotenv'; dotenv.config({ path: process.cwd() + '/.env' });

export class ShopifyAPIClient{
    static defaultVersion = '2026-04';

    #storeDomain;
    #storageHandler;
    #admin;
    #storefront;

    constructor({store, storageHandler, admin, storefront}){
        this.#storeDomain = store;//TODO: This ends with ".myshopify.com", may want to strip this earlier on to save on storage
        this.#storageHandler = storageHandler;
        this.#admin = admin;
        this.#storefront = storefront;
    }

    static async create({store, storageHandler}){
        const client = new ShopifyAPIClient({store, storageHandler});
        await client.#initClients();
        return client;
    }

    async #initClients(){
        console.time(" (CC) Load Tokens");
        const { access_token } = await this.#loadTokens();
        console.timeEnd(" (CC) Load Tokens");
        const apiVersion = ShopifyAPIClient.defaultVersion;
        this.#admin = createAdminApiClient({
            storeDomain: this.#storeDomain,
            apiVersion,
            accessToken: access_token,
        });
        this.#storefront = createStorefrontApiClient({
            storeDomain: this.#storeDomain,
            apiVersion,
            privateAccessToken: access_token,
        });
    }

    async #loadTokens(){
        
        const { access_token, expires_at, refresh_token } = await this.#storageHandler.get(
            {
                store: StorageHandler.TOKEN_STORE,
                key: this.#storeDomain,
                opts: { type: 'json' }
            }
        ) || {};

        if(!access_token || expires_at < Date.now()){
            //DEBUG: The env variable has been added to get things started. Remove when possible;
            return await this.#requestNewTokens(refresh_token ?? process.env.INITIAL_SHOPIFY_REFRESH_TOKEN);
        }

        return { access_token }
    }

    async #requestNewTokens(refreshToken){
        const res = await fetch(`https://${this.#storeDomain}/admin/oauth/access_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.SHOPIFY_CLIENT_ID,
                client_secret: process.env.SHOPIFY_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            })
        });

        const res_json = await res.json();
        const { expires_in, refresh_token_expires_in } = res_json;
        const now = Date.now();
        Object.assign(res_json, { expires_at: now + (expires_in * 1000), refresh_token_expires_at: now + (refresh_token_expires_in * 1000) });
        this.#storageHandler.set({store: StorageHandler.TOKEN_STORE, key: this.#storeDomain, value: res_json});

        return res_json;
    }
    
    //Read Only
    get admin(){ return this.#admin; }
    get storefront(){ return this.#storefront; }
}