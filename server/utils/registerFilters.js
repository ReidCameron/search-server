export function registerFilters(engine){
    const globalContext = this.globalContext;
    engine.registerFilter('image_url', function (product, width, height) {
        const width2Num = +width || 0;
        const height2Num = +height || 0;
        return (
            product.featured_image.url +
            (width2Num ? `&width=${width2Num}` : '') +
            (height2Num ? `&height=${height2Num}` : '')
        );
    });

    //money_format is the money_without_currency value

    //DONE:
    engine.registerFilter('money', function (amount) {
        return globalContext.money_format.replace("{{amount}}", amount);
    });
    //DONE:
    engine.registerFilter('money_amount', function (amount) {
        return amount;
    });

    //TODO: I don't want to add an admin call on every search request to enable this. Think of ways to avoid this
    engine.registerFilter('money_with_currency', function (amount) {
        return "not yet implemented"
        return globalContext.money_format.replace("{{amount}}", amount) + globalContext.currency;
    });
    //DONE:
    engine.registerFilter('money_without_currency', function (amount) {
        return globalContext.money_format.replace("{{amount}}", amount);
    });
    //DONE:
    engine.registerFilter('money_without_trailing_zeros', function (amount) {
        return globalContext.money_format.replace("{{amount}}", amount.replace(/(\.|,)0+$/, ''));
    });
}