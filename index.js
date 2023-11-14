const express = require('express');
const app = express();
const db = require('./db')
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }))
app.use(express.json({ extended: true }))

// Set up multer to handle file uploads
const upload = multer();

class PetDBO {
    constructor(id, name, age, textdescription, raceid, imageURL) {
        this.id = id;
        this.name = name;
        this.age = age;
        this.textdescription = textdescription;
        this.raceid = raceid;
        this.imageURL = imageURL;
    }
}

class PetResponseDTO {
    constructor(id, name, age, textdescription, race, imageURL) {
        this.id = id;
        this.name = name;
        this.age = age;
        this.textdescription = textdescription;
        this.race = race;
        this.imageURL = imageURL;
    }
}

//CRUD functionalities for /pets

app.get('/pets', async (req, res) => {
    const allPetsQueryString = `SELECT * FROM pets`;
    try {
        // Get all pets
        const allPetResults = await db.query(allPetsQueryString);
        const allPets = allPetResults.rows;

        // Get all races
        const racesQueryString = `SELECT * FROM races`;
        const allRaceResults = await db.query(racesQueryString);
        const races = allRaceResults.rows;

        // array to store all transformed pets
        let petArray = [];

        // For each Pet, transform to DTO and get race name
        allPets.forEach(function (pet) {
            //raceName = races[pet.raceid + 1] //not okay to use index here!
            let raceName = "";
            races.forEach(function (race) {
                if (pet.raceid === race.id) {
                    raceName = race.name
                }
            })
            const petDTO = new PetResponseDTO(pet.id, pet.name, pet.age, pet.textdescription, raceName, pet.imageurl)
            petArray.push(petDTO)
        });
        res.json(petArray);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/pets/:id', async (req, res) => {
    const { id } = req.params;
    let parsedId = parseInt(id);
    if (isNaN(parsedId)) {
        res.status(400).send('Invalid ID supplied');
        return
    }
    try {
        let result = await db.query(`SELECT * FROM pets WHERE id = ${id}`);
        if (result.rows.length === 0) {
            res.status(404).send('Pet not found');
            return
        }
        let foundPet = result.rows[0];
        const queryString = `SELECT name FROM races WHERE id = ${foundPet.raceid}`;
        console.log(queryString);
        const raceResult = await db.query(queryString);
        const raceName = raceResult.rows[0].name;
        const petDTO = new PetResponseDTO(foundPet.id, foundPet.name, foundPet.age, foundPet.textdescription, raceName, foundPet.imageurl)
        res.json(petDTO);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/pets', async (req, res) => {
    const { name, raceid, age, textdescription, imageURL } = req.body;
    const queryString = `INSERT INTO pets(name, raceid, age, textdescription, imageURL) values('${name}', ${raceid}, ${age}, '${textdescription}', '${imageURL}');`;
    console.log(queryString)
    try {
        await db.query(queryString);
        res.json(`Added pet ${name} to pets`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Define a route to handle the file upload using PUT
app.put('/images', upload.single('file'), async (req, res) => {
    const file = req.file;
    const newName = req.body.filename;

    if (!file || !newName) {
        console.error('Missing file or filename in the request body');
        return res.status(400).send('Bad Request');
    }

    // Set the destination folder dynamically
    const destinationFolder = 'public/images';

    // Set the full path where the file will be stored with the new filename
    try {
        const filePath = path.join(destinationFolder, newName);

        // Write the file using the fs module
        await fs.writeFile(filePath, file.buffer);

        // figure out image URL
        let imageURL = "http://localhost:3000/images/" + newName

        // Send a response
        res.send(imageURL);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.put('/pets/:id', async (req, res) => {
    const { id } = req.params;
    let parsedId = parseInt(id);
    if (isNaN(parsedId)) {
        res.status(400).send('Invalid ID supplied');
        return
    }
    const { name, raceid, age, textdescription } = req.body;
    const updateQueryString = `UPDATE pets set name = '${name}', raceid = ${raceid}, age = ${age}, textdescription = '${textdescription}' WHERE id = ${id}`;
    try {
        let result = await db.query(`SELECT * FROM pets WHERE id = ${id}`);
        if (result.rows.length === 0) {
            res.status(404).send('Pet not found');
            return
        }
        await db.query(updateQueryString);
        res.send("Update done.");
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
})

app.delete('/pets/:id', async (req, res) => {
    const { id } = req.params;
    let parsedId = parseInt(id);
    if (isNaN(parsedId)) {
        res.status(400).send('Invalid ID supplied');
        return
    }
    try {
        await db.query(`DELETE FROM pets WHERE id = ${id}`);
        res.send("Delete done.");
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
})

//CRUD functionalities for /races

app.get('/races', async (req, res) => {
    const queryString = `SELECT * FROM races`;
    try {
        const result = await db.query(queryString);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/races/:id', async (req, res) => {
    const { id } = req.params;
    let parsedId = parseInt(id);
    if (isNaN(parsedId)) {
        res.status(400).send('Invalid ID supplied');
        return
    }
    try {
        const result = await db.query(`SELECT * FROM races WHERE id = ${id}`);
        if (result.rows.length === 0) {
            res.status(404).send('Race not found');
            return
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/races', async (req, res) => {
    const { name } = req.body;
    const queryString = `INSERT INTO races(name) values('${name}');`;
    try {
        await db.query(queryString);
        res.send(`Added ${name} to races`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.put('/races/:id', async (req, res) => {
    const { id } = req.params;
    let parsedId = parseInt(id);
    if (isNaN(parsedId)) {
        res.status(400).send('Invalid ID supplied');
        return
    }
    const { name } = req.body;
    const queryString = `UPDATE races set name = '${name}' WHERE id = ${id}`;
    try {
        let result = await db.query(`SELECT * FROM races WHERE id = ${id}`);
        if (result.rows.length === 0) {
            res.status(404).send('Race not found');
            return
        }
        await db.query(queryString);
        res.send("Update done.");
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
})

app.delete('/races/:id', async (req, res) => {
    const { id } = req.params;
    let parsedId = parseInt(id);
    if (isNaN(parsedId)) {
        res.status(400).send('Invalid ID supplied');
        return
    }
    try {
        await db.query(`DELETE FROM races WHERE id = ${id}`);
        res.send("Delete done.");
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
})

app.listen(3000, () => {
    console.log("Listening on Port 3000...");
})