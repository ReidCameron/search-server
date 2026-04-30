import liquidjs from "liquidjs";

export class LiquidEngine{
    #fileStore = {};
    #engine
    #templates = {};
    #hasTemplates = false;
    constructor(options){
        const fileStore = this.#fileStore; //TODO: Lookup referencing class prop in fs obj to avoid new variable ref
        this.#engine = new liquidjs.Liquid({
            fs: {
                readFileSync(file) { return fileStore[file] },
                async readFile(file) { return Promise.resolve(fileStore[file]); },
                existsSync() { return true },
                async exists() { return true },
                contains() { return true },
                resolve(root, file, ext) { return file }
            }
        });
        if( typeof options?.customFilters == "function" ){
            options.customFilters(this.#engine);
        }
    }

    async parseFile(fileName, useCacheTemplates = true){
        if(useCacheTemplates && Object.hasOwn(this.#templates, fileName)) return this.#templates[fileName];

        const tpl = await this.#engine.parseFile(fileName);
        this.#templates[fileName] = tpl;
        this.#hasTemplates = true;

        return tpl;
    }

    async renderFileWithContext(fileName, context){
        if(this.#templates[fileName]){
            return this.#engine.render(this.#templates[fileName], context)
        } else {
            return Promise.resolve("");
        }
    }

    addFiles(files){
        Object.assign(this.#fileStore, files);
    }

    //Read Only
    get hasTemplates(){ return this.#hasTemplates; }

}
