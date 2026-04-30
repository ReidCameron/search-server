export function buildUrl(url, paramEntries) {
    const newURL = new URL(url);
    for (const [key, value] of paramEntries) {
        if (key.startsWith('filter.') || key.startsWith('sort.')) {
            if (value.includes(":")) {
                //Handle filters with custom ranges
                const [low, high] = value.split(':');
                newURL.searchParams.append(key + '.low', low);
                newURL.searchParams.append(key + '.high', high);
            } else {
                //Other filters
                newURL.searchParams.append(key, value);
            }
        } else if (key != "domain") {
            //Other Params
            newURL.searchParams.set(key, value);
        }
    }
    return newURL.toString();
}

export function handleize(str) {
    return str
        .toLowerCase()                         // convert to lowercase
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .normalize('NFD')                      // split accented characters
        .replace(/[\u0300-\u036f]/g, '')       // remove accents/diacritics
        .replace(/[^a-z0-9\s-]/g, '')          // remove non-alphanumeric chars (except spaces and hyphens)
        .trim()                                // trim leading/trailing whitespace
        .replace(/\s+/g, '-')                  // replace spaces with hyphens
        .replace(/-+/g, '-')                  // collapse multiple hyphens
}