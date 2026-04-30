import { handleize } from "./functions.mjs";

export function buildProductQuery(results, config = {}){
    return {
        query: `query GetProducts{
            shop{
                moneyFormat
            }
            ${
                //TODO: Need to determine config structure and proper input args
                config.metaobjects?.enable ? (
                    `metaobject(handle: {handle:"app--337510563841--athos_color_mapping"}){
                        field
                    }`
                ):('')
            }
            ${
                results.map((result, index) => { 
                    return buildResultSubQuery(index, handleize(result.name));
                }).join("")
            }
        }`
    };
}

function buildResultSubQuery(index, handle){
    //TODO: Need to optionally add variants (and other things) depending on configs
    return (
        `result_${index}: product(handle: "${handle}"){
            id
            handle
            title
            vendor
            totalInventory
            availableForSale
            featuredImage {
                url
                altText
            }
            images(first: 5) {
                nodes {
                    url
                    altText
                }
            }
            priceRange {
                maxVariantPrice {
                    amount
                }
                minVariantPrice {
                    amount
                }
            }
            compareAtPriceRange {
                maxVariantPrice {
                    amount
                }
                minVariantPrice {
                    amount
                }
            }
            variants(first: 15) {
                nodes {
                    id
                    title
                    sku
                    quantityAvailable
                    availableForSale
                    image {
                        url
                        altText
                    }
                    price {
                        amount
                    }
                    compareAtPrice {
                        amount
                    }
                }
            }
        }
    `);
}
//TODO: I don't want to add an admin call on every search request. Need a way to avoid this, possibly using Shopify window obj
export function getCurrencies(){
    return (
        `shop{
            currencyFormats{
                moneyFormat
                moneyWithCurrencyFormat
            }
        }
    `);
}

export function buildFilesQuery(config){
    return {
        query: `query getFiles($id: ID!, $filenames: [String!]) {
            theme(id: $id) {
                id
                name
                role
                files(filenames: $filenames) {
                    nodes {
                        filename
                        body {
                            ... on OnlineStoreThemeFileBodyText {
                                content
                            }
                        }
                    }
                }
            }
        }`,
        variables:{
            id: "gid://shopify/OnlineStoreTheme/" + config.id,
            filenames: config.filenames,
        }
    }
}