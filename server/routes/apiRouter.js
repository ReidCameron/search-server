import { Router, json } from 'express';
const router = Router();
import { handler } from "../handlers/search.js";
import payload from "../misc/payload.js"; //DEBUG

//Middleware
router.use(json({ limit: '1mb' }));

//Routes
router.get('/', async (req, res, next) =>{
    res.json({'message': 'Search Server API'});
});

//DEBUG: Used to avoid sending POST from browser while testing
router.get('/search', async (req, res, next) =>{
    console.time("Total");
    try {
        // console.time("Parse Post Body");
        // const bodyJson = JSON.parse(req.body.toString());
        // console.timeEnd("Parse Post Body");
        await handler({body: payload, res});
    } catch (error) { next(error); }
    console.timeEnd("Total");
    return;
});

router.post('/search', async (req, res, next) =>{
    console.time("Total");
    try {
        console.time("Parse Post Body");
        const bodyJson = JSON.parse(req.body.toString());
        console.timeEnd("Parse Post Body");
        await handler({body: bodyJson, res});
    } catch (error) { next(error); }
    console.timeEnd("Total");
    return;
});

//404
router.use((req, res) => {
    res.status(404).json({'message': 'Endpoint does not exist.'});
});

//Exports
export default router;