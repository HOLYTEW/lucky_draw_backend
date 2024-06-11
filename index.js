const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client } = require('@notionhq/client');

dotenv.config();
const app = express(); // Updated to const

app.use(cors());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function getLength(){
    const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
            property: "isAble",
            checkbox: {
                equals: true,
            }
        },
    });

    return response.results.length;
}

async function getItemName(pageID) {
    const response = await notion.pages.retrieve({ page_id: pageID });
    return response.properties.Name.title[0].plain_text; 
}

async function randomDoors() {
    const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
            property: "isAble",
            checkbox: {
                equals: true,
            }
        },
        sorts: [{
            property: "ID",
            direction: "ascending"
        }]
    });

    let obj = response.results.map((item) => item.id);

    let length = await getLength();
    let randNumber = Math.floor(Math.random() * length);
    let pageID = obj[randNumber];

    return pageID;
}

async function getAllPrize(){
    const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
            property: "isAble",
            checkbox: {
                equals: true,
            }
        },
        sorts: [{
            property: "ID",
            direction: "ascending"
        }]
    }); 

    let allPrize = await Promise.all(response.results.map(async item => {
        return {
            id: item.id,
            prize_ID: item.properties.ID.unique_id.number, 
            prize_image: item.properties.image.url, 
            prize_cover: item.properties.cover.url,
            prize_name: item.properties.Name.title[0]?.plain_text, 
        } 
    }));

    return allPrize;
}

app.get('/draw', async (req, res) => {
    let pageID = await randomDoors();
    let itemName = await getItemName(pageID);

    await notion.pages.update({
        page_id: pageID,
        properties: {
          'isAble': {
            checkbox: false,
          },
        },
    });

    res.json({item: itemName});
});

app.get('/getAll', async (req, res) => {
    res.json(await getAllPrize());
})

app.post('/selectedPrize', async (req, res) => {
    let selectedPrize = req.body;
    console.log(selectedPrize.id);

    await notion.pages.update({
        page_id: selectedPrize.id,
        properties: {
          'isAble': {
            checkbox: false,
          },
        },
    });

    res.sendStatus(200);
})

app.listen(8080, () => {
    console.log("Server running");
});
