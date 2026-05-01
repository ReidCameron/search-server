/* Imports */
import dotenv from 'dotenv'; dotenv.config({ path: process.cwd() + '/.env' });
import { buildFilesQuery, buildProductQuery } from "../utils/gqlQueries.js";
import { buildUrl, handleize } from "../utils/functions.js";
import { registerFilters } from "../utils/registerFilters.js";
import { LiquidEngine } from "../utils/LiquidEngine.js";
import { ShopifyAPIClient } from "../utils/ShopifyAPIClient.js";
import { getBlockContext } from "../utils/getBlockContext.js";
import { StorageHandler } from '../utils/StorageHandler.js';

/* Global Vars */
const globalContext = {}; //This objcet will be used and edited in mulitple places
const liquidEngine = new LiquidEngine({ customFilters: registerFilters.bind({globalContext}) });
const storageHandler = new StorageHandler();

/* Handler */
export async function handler({ body, res }) {
    //Validate POST Body Params
    console.time("Validaiton");
    if (
        !Array.isArray(body.apiParams) ||
        !Array.isArray(body.blockSettings) ||
        typeof body.sectionSettings !== 'object' ||
        typeof body.siteId !== 'string'
    ) {
        return res.status(400).send(
            "Post body for 'hydrate' op must be a JSON object with the properties 'apiParams'[Array], 'blockSettings'[Array], 'sectionSettings'[Object], and 'siteId'[String]."
        );
    }
    console.timeEnd("Validaiton");

    //Get context (data) and templates
    // const shopifyApiClient = new ShopifyApiClient(body.store, getKey(body.store));
    console.time("Create Client");
    const shopifyApiClient = await ShopifyAPIClient.create({store: 'my-test-store-123456789142.myshopify.com', storageHandler});
    console.timeEnd("Create Client");

    console.time("Get Data and Templates")
    let contextAndTemplates;
    try {
        contextAndTemplates = await Promise.all([getContext(body, shopifyApiClient.storefront), getTemplates(body, shopifyApiClient.admin)])
    } catch (error) {
        console.log({ msg: error.message })
        return res.status(500).send("Something went wrong with an upstream service.");
    }
    console.timeEnd("Get Data and Templates")

    //Add Global Context, SS Data, GQL Data, and Settings to context
    //Render Markup using context and templates
    //TODO: Consider adding block types/categories where the user can send a custom category(that is not an override),
    //      and it will receive the normal data given to that block type (or they can specify what data they'd need)
    console.time("Build Context and Render");
    const { apiData, gqlData } =  contextAndTemplates[0];
    Object.assign(globalContext, getGlobalContext({apiData, gqlData, body}))
    const renderedComponents = [];
    await Promise.all(
        body.blockSettings.map(async (block, index)=>{
            const fileName = block.type.replaceAll('_','-');
            const localContext = getBlockContext(block, body.sectionSettings, body.apiParams, apiData, gqlData);
            const context = {
                ...globalContext, //Data that each component might use (shop, fonts, colors, etc.)
                ...localContext, //Settings unique to each component (products, pagiation data, etc.)
                section: { settings: body.sectionSettings }, //Section settings conifugred in the theme editor
                block: { settings: block.settings } //Block settings conifugred in the theme editor
            };

            const markup = await liquidEngine.renderFileWithContext(fileName, context); //TODO: Possibly some final error checking here, or helpful hints for what broke in rendering process
            
            renderedComponents.push({
                type: block.type,
                markup: markup.replace(/\n|\s{2,}/g, ''),
            });
        })
    );
    console.timeEnd("Build Context and Render");

    return res.json({
        op: "search",
        components: renderedComponents,
    });
}

/* Get Context (API and GQL Data) */
const getContext = async (body, storefrontClient) => {
    console.time(" (GDaT) Get Data"); console.time("   (GD) API Search");
    const apiData = await getAPIData(body); console.timeEnd("   (GD) API Search"); console.time("   (GD) GQL Search");
    const gqlData = await getShopifyProductData(apiData, storefrontClient); console.timeEnd("   (GD) GQL Search"); console.timeEnd(" (GDaT) Get Data");
    return { apiData, gqlData };
}
async function getAPIData(body) {
    const apiRequestUrl = buildUrl(`https://${body.siteId}.a.searchspring.io/api/search/search.json`, body.apiParams)
    const res = await fetch(apiRequestUrl);
    return await res.json();
}
async function getShopifyProductData(apiData, storefrontClient) {
    //TODO: Look into savedSearch
    //TODO: Need a way to pull in metafields based on list(or predetermined fields) in body request that may be used in the theme
    const { query } = buildProductQuery(apiData.results);//TODO: import config options in empty obj
    const { data, errors } = await storefrontClient.request(query);

    if(errors) {
        console.error({"GQL ERROR MSG:": errors.message});
        console.dir(errors.graphQLErrors, {depth: 4});
    }
    
    return data;
}

/* Get Templates (Shopify Theme Files) */
const getTemplates = async (body, adminClient) => {
    console.time(" (GDaT) Get Templates");
    if(body.custom?.enableCustomTemplates || liquidEngine.hasTemplates){
        console.timeEnd(" (GDaT) Get Templates");
        return Promise.resolve();
    }
    const files = await getShopifyFiles(adminClient, body.themeId);
    liquidEngine.addFiles(files);

    const tpls = await Promise.all(
        body.blockSettings.map((block)=>{
            const fileName = block.type.replaceAll('_','-');
            return liquidEngine.parseFile(fileName, true); //DEBUG: false should be removed in prod //TODO: Caching might not make sense with hasTemplates logic
        })
    );

    console.timeEnd(" (GDaT) Get Templates");
    return tpls;
}
async function getShopifyFiles(adminClient, themeId) {
    const { query, variables } = buildFilesQuery({
        id: themeId,
        //TODO: supply filenames from default config, or config from theme
        filenames: [
            //Header
            "snippets/athos-header.liquid",
            
            //Toolbar
            "snippets/athos-toolbar.liquid",

            //Results
            "snippets/athos-results.liquid",
            "snippets/athos-result.liquid",

            //Sidebar
            "snippets/athos-sidebar.liquid",
            "snippets/athos-facet.liquid",
            "snippets/athos-facet.liquid-options.liquid",
            "snippets/athos-facet.liquid-options-grid.liquid",
            "snippets/athos-facet.liquid-options-hierarchy.liquid",
            "snippets/athos-facet.liquid-options-list.liquid",
            "snippets/athos-facet.liquid-options-palette.liquid",
            "snippets/athos-facet.liquid-options-slider.liquid",

            //Pagination
            "snippets/athos-pagination.liquid",
            "snippets/athos-pagination-infinite.liquid",
            "snippets/athos-pagination-load-more.liquid",
            "snippets/athos-pagination-numbered.liquid"
        ],
    });

    const { data, errors } = await adminClient.request(query, { variables });
    if(errors) {
        console.error({"GQL ERROR MSG:": errors.message});
        console.dir(errors.graphQLErrors, {depth: 4});
    }
    
    return Object.fromEntries(data.theme.files.nodes.map((node) => {
        return [node.filename.match(/(?<=\/)[^/]+(?=\.)/)?.[0], node.body.content]
    }));
}

/* Helper to add nice things in global context */
function getGlobalContext({apiData, gqlData, body}){
    return {
        /* API Related */
        siteId: body.siteId,

        /* Supplemental GQL Data*/
        money_format: gqlData.shop.moneyFormat
    }
}