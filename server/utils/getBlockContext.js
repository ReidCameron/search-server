const functionMap = {
    athos_header: getHeaderContext,
    athos_toolbar: getToolbarContext,
    athos_sidebar: getSidebarContext,
    athos_pagination: getPaginationContext,
    athos_tab: getTabContext,
    athos_results: getResultsContext
}

function getHeaderContext({apiData}){
    return {
        search_query: apiData.breadcrumbs.at(0)?.filterLabel === 'Search' && apiData.breadcrumbs[0].filterValue || '',
        didYouMean: apiData.didYouMean,
        query: apiData.query,
    };

}
function getToolbarContext({apiData, requestParams}){
    const domain = requestParams?.find(paramEntry => paramEntry[0] === 'domain')?.[1];
    const hash = domain?.split("#")[1]?.replace(/^\//,'');
    const sortRegex = new RegExp(`^sort:[^:]+:[^:]+$`);
    const hashParameters = (hash?.split('/') ?? []).filter( h => !sortRegex.test(h));
    apiData.sorting.options.forEach((option)=>{
        if(!option.active){
            hashParameters.push(`sort:${option.field}:${option.direction}`);
            option.href = '#' + hashParameters.join('/');
        }
    });
    return {
        pagination: apiData.pagination,
        active_label: apiData.sorting.options.find(options => options.active === 1)?.label || "Relevance",
        sorting: apiData.sorting,
    }
}
function getSidebarContext({apiData, requestParams}){
    const domain = requestParams?.find(paramEntry => paramEntry[0] === 'domain')?.[1];
    const hash = domain?.split("#")[1]?.replace(/^\//,'');
    const hashParameters = hash?.split('/') ?? [];

    apiData.facets?.forEach((facet)=>{
        //Construct facet variables excluding values
        const facetFields = Object.keys(facet).filter( key => key !== "values" );
        const variables = [];
        facetFields.forEach((fieldName)=>{
            const variableName = `facet_${fieldName}`;
            variables.push(`${variableName}: "${facet[fieldName] ?? ''}"`);
        })

        //Serialize facet values to make values variable
        //  objects cannot be created and passed in liquid, so the values variable must be an array, string, or number
        facet.values.forEach((value)=>{
            //Create the hash parameter that will be added to the URL when the facet option is selected
            var valueHash = '';
            if(value.low && value.high){
                valueHash = `filter:${facet.field}:${value.low}:${value.high}`
            } else {
                valueHash = `filter:${facet.field}:${encodeURIComponent(value.value)}`;//Encode to (avoid conflict with colon delimiter???)
            }

            //Determine how the above hash parameter will be combined with the current hash paramters to form a new URL
            const newHashes = [];
            const filterRegex = new RegExp(`^filter:${facet.field}:[^:]+$`);
            hashParameters?.forEach((hash)=>{
                //Checks which hash parameters from the previous url should stay
                /**
                 * Add a facet selection if:
                 *  - It is not related to this facet
                 *  - It is related to this facet and this facet is not a single type and it is not the current value (to deselect)
                 */ 
                if(
                    !filterRegex.test(hash) || //non-Athos related params and Athos params not related to this facet are added
                    (
                        facet.multiple !== 'single' && //any selection related to a single-type facet is removed
                        hash !== valueHash //the current value for multiple-type facets is removed in order to deselect it
                    )
                ){
                    newHashes.push(hash);
                }
            });

            //add new entry if not active
            if(!value.active) newHashes.push(valueHash);

            //Build hashString from hash list
            value.href = '#' + newHashes.join('/'); //Fragment identifier is left when newHashes is empty to prevent a full page reload when all filters are cleared
        });

        // Hierarchy Facet Logic
        //TODO: Think about what to do when there are multiple hiearchyFacets
        if(facet.type === 'hierarchy' && facet.active === '1'){
            const currentSelectedPath = breadcrumbs?.find((crumb)=>{
                return crumb.field === hierarchyFacet?.field
            })?.filterValue ?? '';

            if(currentSelectedPath){
                const filterRegex = new RegExp(`(^|/)filter:${hierarchyFacet.field}:[^(:|/)]+`, 'g');
                const baseHash = '#' + hash.replaceAll(filterRegex, '')?.replace(/^\//,'');

                const categoryObjs = currentSelectedPath.split(hierarchyFacet.hierarchyDelimiter).map((category, idx, arr)=>{
                    const path = arr.slice(0,idx + 1).join(hierarchyFacet.hierarchyDelimiter);
                    const valueHash = `filter:${hierarchyFacet.field}:${path}`;
                    return { label: category, hrefh: baseHash + '/' + valueHash}
                });

                facet.parent_categories = [{label: "View All", href: baseHash}, ...categoryObjs];
            }
        }
    });

    return {
        facets: apiData.facets,        
    }
}
function getPaginationContext({apiData}){
    return {
        pagination: apiData.pagination,
    }
}
function getTabContext({section, apiData}){
    return {
        tab_name: section.tab_name,
        total_results: apiData.pagination.total_results
    }
}
function getResultsContext({apiData, gqlData}) {
    const ctx = {};
    
    /* Products */
    ctx.results = apiData.results.map((apiResult, index) => {
        const gqlResult = gqlData[`result_${index}`];
        
        return gqlResult ? {
            /* Custom Athos Fields */
            index,
            intellisuggestData: apiResult.intellisuggestData,
            intellisuggestSignature: apiResult.intellisuggestSignature,

            /* General Fields */
            id: gqlResult.id.split('/').pop(),
            handle: gqlResult.handle,
            title: gqlResult.title,
            vendor: gqlResult.vendor,
            inventory_quantity: gqlResult.totalInventory,
            available: gqlResult.availableForSale,

            /* Images */
            featured_image: {
                url: gqlResult.featuredImage.url,
                alt_text: gqlResult.featuredImage.altText,
            },
            images: gqlResult.images.nodes.map((node)=>{
                return { url: node.url, alt_text: node.altText }
            }),

            /* Pricing */
            price: gqlResult.priceRange.minVariantPrice.amount,
            price_max: gqlResult.priceRange.maxVariantPrice.amount,
            price_min: gqlResult.priceRange.minVariantPrice.amount,
            compare_at_price: gqlResult.compareAtPriceRange.minVariantPrice.amount,
            compare_at_price_max: gqlResult.compareAtPriceRange.maxVariantPrice.amount,
            compare_at_price_min: gqlResult.compareAtPriceRange.minVariantPrice.amount,

            /* Variants */
            //TODO: Could add logic based on block.setting_enable_variants here and in the gql request
            variants: gqlResult.variants.nodes.map((node)=>{
                return {
                    //General Fields
                    id: node.id,
                    title: node.title,
                    sku: node.sku,
                    inventory_quantity: node.quantityAvailable,
                    available: node.availableForSale,

                    //Images
                    featuredImage: {
                        url: node.image.url,
                        alt_text: node.image.altText
                    },
                    image: {
                        url: node.image.url,
                        alt_text: node.image.altText
                    },

                    //Pricing
                    price: node.price.amount,
                    compare_at_price: node.compareAtPrice.amount,
                }
            })
        } : { index, error: true };
    });

    return ctx;
}

export function getBlockContext(block, section, requestParams, apiData, gqlData){
    const func = functionMap[block.type];
    return func && func({block, section, requestParams, apiData, gqlData}) || {};
}
