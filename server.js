const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");
const multer = require('multer')
const cors = require("cors");
const { ReadConcern } = require("mongodb");
const path = require('path');
const app = express();

app.use(express.static("public")); // Use the Public folder for html, scripts, and css
app.use(express.json()); // Process JSON
app.use(cors()); // Cross-site/domain allowance

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/public/images/'); // Specify your upload destination
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext); // Rename file with timestamp and original extension
    }
});

const upload = multer({ storage: storage });


mongoose
    .connect(
        "mongodb+srv://zoelenore:1415Birchave!@assignment15.dg9dui2.mongodb.net/?retryWrites=true&w=majority&appName=assignment15")
    .then(() => console.log("Connected to mongodb..."))
    .catch((err) => console.error("DB Error: Could not connect to MongoDB.", err));

const craftSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    supplies: [String]
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

const Craft = mongoose.model("crafts", craftSchema);

let crafts = [];

//Fetch all the crafts in Mongo and add them to the Array
Craft.find({}) // Use find() without a callback
    .then(documents => {
        // Iterate over the array of documents
        documents.forEach(doc => {
            // Push each document into the 'crafts' array
            crafts.push({
                id: doc._id,
                name: doc.name,
                image: doc.image,
                description: doc.description,
                supplies: doc.supplies
            });
        });
    })
    .catch(err => {
        console.error('DB Error retrieving crafts:', err);
        // Handle error
    });

/* Delete a craft with the DELETE handler */
app.delete('/api/crafts/:id', (req, res) => {
    const recId = req.params.id;
    console.log("Delete Record ID:", recId);

    const objectId = mongoose.Types.ObjectId.createFromHexString(recId);

    Craft.findOneAndDelete({ _id: objectId })
        .then(deletedCraft => {
            if (!deletedCraft) {
                console.log("Craft not found for deletion");
                return res.status(404).json({ message: 'Craft not found for deletion' });
            }
            console.log("Craft deleted successfully");
            res.status(200).json({ message: 'Craft deleted successfully', deletedCraft });
        })
        .catch(error => {
            console.error('Error deleting craft:', error);
            res.status(500).json({ message: 'Error deleting craft' });
        });
});


/* Add a new craft with the POST handler */
app.post("/api/crafts", upload.single("image"), (req, res) => {
    let filename;  // Determine filename here

    if (req.file && req.file.filename) {
        filename = req.file.filename;
    } else {
        console.log("Image file is required for new crafts");
        res.status(400).send("Image file is required for new crafts");
        return;
    }

    // Extract just the filename part if necessary
    filename = extractFilename(filename);

    // Validate the craft data
    const craft = {
        name: req.body.name,
        image: filename,
        description: req.body.description,
        supplies: req.body.supplies.split(",") 
    };

    const validation = validateCraft(craft);
    if (validation.error) {
        res.status(400).send("Validation error: " + validation.error.details[0].message);
        return;
    }

    const newCraft = new Craft(craft);
    newCraft.save()
        .then(savedCraft => {
            console.log("Craft saved successfully");
            res.status(201).send(savedCraft);
        })
        .catch(error => {
            console.error('DB Error creating craft:', error);
            res.status(500).send('DB Error creating craft');
        });
});

/* Edit an existing craft with the PUT handler */
app.put("/api/crafts/:id", upload.single("image"), (req, res) => {
    const craftId = req.params.id;
    let filename;

    if (req.file && req.file.filename) {
        filename = req.file.filename;
    } else if (req.body.imgsrc) {
        filename = extractFilename(req.body.imgsrc);
    } else {
        console.log("No new image uploaded; using existing image info.");
        filename = req.body.image;  // Use existing image if no new file is uploaded
    }

    filename = extractFilename(filename);
    delete req.body.imgsrc;

    const updates = {
        name: req.body.name,
        image: filename,
        description: req.body.description,
        supplies: req.body.supplies.split(",")  
    };

    const validation = validateCraft(updates);
    if (validation.error) {
        res.status(400).send("Validation error: " + validation.error.details[0].message);
        return;
    }

    Craft.findByIdAndUpdate(craftId, { $set: updates }, { new: true })
        .then(updatedCraft => {
            if (!updatedCraft) {
                return res.status(404).send('Craft not found');
            }
            console.log("Craft updated successfully");
            res.send(updatedCraft);
        })
        .catch(error => {
            console.error('DB Error updating craft:', error);
            res.status(500).send('DB Error updating craft');
        });
});

function extractFilename(url) {
    // Split the URL by forward slashes
    const parts = url.split('/');
    // Get the last part (which should be the filename)
    const filename = parts[parts.length - 1];
    return filename;
}

const validateCraft = (craft) => {
    const schema = Joi.object({
        _id: Joi.allow(""),
        name: Joi.string().min(3).required(),
        image: Joi.string().min(5).required(),
        description: Joi.string().min(1).required(),
        supplies: Joi.allow(),
    });
    return schema.validate(craft);
}

app.get("/api/crafts", (req, res) => {
    // Fetch all the crafts from MongoDB
    Craft.find({})
        .then(documents => {
            // Map each document to the desired format
            const crafts = documents.map(doc => ({
                id: doc._id,
                name: doc.name,
                image: doc.image,
                description: doc.description,
                supplies: doc.supplies
            }));
            // Respond with the fetched crafts data
            res.json(crafts);
        })
        .catch(err => {
            console.error('DB Error retrieving crafts:', err);
            // Handle error
            res.status(500).send('DB Error retrieving crafts');
        });
});

app.listen(3005, () => {
    console.log("Listening on port 3005");
});