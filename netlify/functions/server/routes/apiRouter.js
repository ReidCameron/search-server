const express = require('express');
const router = express.Router();
const search = require("../handlers/search");
const payload = require("../misc/payload").default; //DEBUG

//Middleware
router.use(express.json({ limit: '1mb' }));

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
        await search.handler({body: payload, res});
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
        await search.handler({body: bodyJson, res});
    } catch (error) { next(error); }
    console.timeEnd("Total");
    return;
});

//404
router.use((req, res) => {
    res.status(404).json({'message': 'Endpoint does not exist.'});
});

//Exports
module.exports = router;