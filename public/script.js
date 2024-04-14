class Craft {
    constructor(id, name, image, description, supplies) {
        this.id = id;
        this.name = name;
        this.image = "images/" + image;
        this.description = description;
        this.supplies = supplies;
    }

    static async fetch(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const craftData = await response.json();
            const craft = craftData.map(craftData => {
                const { id, name, image, description, supplies } = craftData;
                return new Craft(id, name, image, description, supplies);
            });
            return craft;
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    get renderCraft() {
        /* Make the main section to hold all the craft info      
           The craft cards are just the image for the craft project, but when clicked on
           they will open a modal lightbox with details about the craft project.
        */
        const craftProject = document.createElement("section");
        craftProject.classList.add("craft-card"); // Flex container for top portion
        const recId = this.id;

        // Set custom data attribute to the mongoDB primary key.
        craftProject.setAttribute("data-rec-id", recId);

        const target = "modal-" + this.id;

        // Make the photo of the craft - to the right and is 300px
        const craftPhoto = document.createElement("img");
        craftPhoto.src = this.image;
        craftPhoto.classList.add("photo-craft");
        craftProject.onclick = () => { modalOpen(target); };
        craftProject.appendChild(craftPhoto);

        return craftProject;
    }

    get expandedSection() {
        const craftDetailCard = document.createElement("section");
        const target = "modal-" + this.id
        craftDetailCard.classList.add("w3-modal");
        craftDetailCard.id = target;

        /* Add the main div which will contain the modal */
        const infoDiv = document.createElement("div");
        infoDiv.classList.add("w3-modal-content");
        infoDiv.classList.add("expanded-info");

        /* Add the next div which will contain the Content of the modal */
        const contentDiv = document.createElement("div");

        /* Add Close Button for Modal */
        const closeButton = document.createElement("span");
        closeButton.classList.add("w3-button");
        closeButton.classList.add("w3-display-topright");
        closeButton.classList.add("close-button");
        closeButton.onclick = () => { modalClose(target); };
        closeButton.innerHTML = "&times;";

        /* Put close button into the container for the expanded info card */
        contentDiv.appendChild(closeButton);

        /* Create an image element for the craft project */
        const craftPhoto = document.createElement("img");
        craftPhoto.src = this.image;
        craftPhoto.id = "img-" + this.id;
        craftPhoto.classList.add("craft-photo-small");

        /* Create header for the title */
        const heading = document.createElement("span");
        heading.classList.add("craft-details-header");
        heading.id = "header-" + this.id;
        heading.innerText = this.name;

        /* Add Edit button */
        const editIcon = document.createElement("img");
        const editTarget = this.id;
        editIcon.src = "images/icon-edit.png";
        editIcon.classList.add("icons");
        editIcon.id = "edit-" + this.id;
        editIcon.onclick = () => { editCraft(editTarget); };

        /* Add Delete button */
        const deleteIcon = document.createElement("img");
        const deleteTarget = this.id;
        deleteIcon.src = "images/icon-delete.png";
        deleteIcon.classList.add("icons");
        deleteIcon.id = "delete-" + this.id;
        deleteIcon.onclick = () => { prepDelete(deleteTarget) };

        /*Add the icons to the header */
        heading.appendChild(editIcon);
        heading.appendChild(deleteIcon);

        /* Create the text div and elements */
        const craftDetails = document.createElement("p");
        craftDetails.classList.add("wordwrap");
        let craftText = "";
        craftText += "<p id='" + "desc-" + this.id + "'>" + this.description + "</p>";
        craftText += "<p><h3>Supplies Needed</h3></p>";
        craftText += "<ul id='slist-" + this.id + "'>";
        let supplyIndex = 0;
        this.supplies.forEach((craftSupply) => {
            supplyIndex++;
            craftText += "<li id='" + this.id + "-" + supplyIndex + "'>" + toTitleCase(craftSupply) + "</li>";
        });
        craftText += "</li>";

        craftDetails.innerHTML = craftText;

        /* Create div to contain the expanded text and image */
        const infoCard = document.createElement("div");
        infoCard.classList.add("craft-details");
        infoCard.appendChild(heading);
        infoCard.appendChild(craftDetails);

        /* Put InfoCard into the modal content under the close button */
        contentDiv.appendChild(infoCard);

        /* Add the inside stuff to the modal dialog */
        infoDiv.appendChild(craftPhoto);
        infoDiv.appendChild(contentDiv);
        craftDetailCard.appendChild(infoDiv);

        return craftDetailCard;
    }
}

const prepDelete = (recId) => {
    document.getElementById("confirmationDialog").showModal();
    const deleteButton = document.getElementById("deleteButton");
    const deleteInfo = document.getElementById("msg-delete");
    const craftHeader = document.getElementById("header-" + recId);
    deleteInfo.innerText = "Are you sure you want to delete '" + craftHeader.innerText + "'?";
    deleteButton.onclick = () => { deleteCraft(recId); };

}

const modalOpen = (theName) => {
    document.getElementById(theName).style.display = "block";
}

const modalClose = (theName) => {
    if (!theName.includes("modal")) {
        const theForm = document.getElementById("add-crafts-form");
        theForm.reset();
    }
    clearCraftTable();
    document.getElementById("img-prev").src = "";
    document.getElementById(theName).style.display = "none";
}

const loadCraft = async () => {
    const url = "https://assignment18-jsu9.onrender.com:3005/api/crafts";
    try {
        const craft = await Craft.fetch(url);
        return await craft;
    } catch (error) {
        console.log(error);
    }
}

// It bugs me when the JSON has lowercase to start the supply names, so this fixes it
const toTitleCase = str => {
    return str.replace(/\w\S*/g, txt => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

//If the input for supplies is not empty, then add a new text input to the form and drop the button
const addSupplies = () => {
    const theForm = document.getElementById("add-crafts-form");
    const suppliesTable = document.getElementById("supplies-section");
    const currentSupplies = suppliesTable.querySelectorAll("input.short-input");
    const lastRow = document.getElementById("add-supplies");
    let supplyCount = currentSupplies.length;

    if (currentSupplies[supplyCount - 1].value !== "") {
        const newRow = document.createElement("tr");
        let newSupplyData = "<td class='right'>&nbsp;</td>";
        newSupplyData += "<td class='left'>";
        newSupplyData += "<input class='short-input' type='text' id='supplies-" + supplyCount + "' name='supplies-" + supplyCount + "' ";
        newSupplyData += " value='" + currentSupplies[supplyCount - 1].value + "' required /></td></tr>";
        newRow.innerHTML = newSupplyData;
        // Check if lastRow is a direct child of suppliesTable
        if (lastRow.parentNode === suppliesTable.querySelector("tbody")) {
            suppliesTable.querySelector("tbody").insertBefore(newRow, lastRow);
        } else {
            console.error("Error: lastRow is not a direct child of suppliesTable.");
        }
    }
}


const deleteCraft = (recId) => {
    const url = `https://assignment18-jsu9.onrender.com:3005/api/crafts/${recId}`;
    console.log("Deleting Craft ID:", recId);
    const options = {
        method: "DELETE", // Change to DELETE
        headers: {
            "Content-Type": "application/json"
        }
    };

    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            console.log("Delete request successful:", data);
        })
        .catch(error => {
            console.error("Error sending delete request:", error);
        });

    const confirmationDialog = document.getElementById("confirmationDialog");
    confirmationDialog.close();
    modalClose("modal-" + recId);
    document.getElementById("craft-section").innerHTML = "";
    initGallery();
}


const editCraft = (recId) => {
    // Because the modalClose function resets the input form, we need to call it before we begin populating the form 
    modalClose("modal-" + recId);

    /* Change the Save buttong to point to the PUT and not the POST */
    document.getElementById("add-crafts-form").onsubmit = putCraft;

    // Set the _id to the record ID so that the handler knows this is NOT a new record. It's -1 otherwise 
    document.getElementById("craft-id").value = recId;

    // Get the contents of the view modal - we'll copy it to the input form from the add-a-craft section //
    const craftName = document.getElementById("header-" + recId).innerText;
    const craftDesc = document.getElementById("desc-" + recId).innerText;
    const craftSupplies = document.getElementById("slist-" + recId);
    const craftImage = document.getElementById("img-" + recId).src;
    let supplyCount = 0;
    let supplyArray = [];

    console.log(craftName + "\n" + craftDesc + "\n" + craftImage);
    if (craftSupplies) {
        // Get all list items within the unordered list
        const listItems = craftSupplies.getElementsByTagName("li");
        supplyCount = listItems.length;
        // Iterate through each list item and extract inner HTML
        for (let i = 0; i < listItems.length; i++) {
            const innerText = listItems[i].innerText;
            supplyArray.push(innerText);
            console.log(i + " " + innerText);
        }
    } else {
        console.log("Craft supplies list is empty.");
    }

    const theForm = document.getElementById("add-crafts-form");
    const suppliesTable = document.getElementById("supplies-section");
    const currentSupplies = suppliesTable.querySelectorAll("input.short-input");
    const lastRow = document.getElementById("add-supplies");

    document.getElementById("img-prev").src = craftImage;
    document.getElementById("craft-name").value = craftName;
    document.getElementById("craft-desc").value = craftDesc;
    document.getElementById("imgexisting").value = craftImage;

    for (let i = 0; i < supplyCount - 1; i++) {
        if (supplyCount > 0) {
            const newRow = document.createElement("tr");
            let newSupplyData = "<td class='right'>&nbsp;</td>";
            newSupplyData += "<td class='left'>";
            newSupplyData += "<input class='short-input' type='text' id='supplies-" + (i + 1) + "' name='supplies-" + (i + 1) + "' ";
            newSupplyData += " value='" + supplyArray[i] + "' required /></td></tr>";
            newRow.innerHTML = newSupplyData;
            // Check if lastRow is a direct child of suppliesTable

            if (lastRow.parentNode === suppliesTable.querySelector("tbody")) {
                suppliesTable.querySelector("tbody").insertBefore(newRow, lastRow);
            } else {
                console.error("Error: lastRow is not a direct child of suppliesTable.");
            }
        }
    }
    document.getElementById("supplies-0").value = supplyArray[supplyCount - 1];


    modalOpen("add-craft");

}

// Empty out the card that held the craft projects
const clearCraftTable = () => {
    const theTable = document.getElementById('supplies-section');
    let tableHTML = '<thead></thead><tbody><tr id="add-supplies"><td class="right">Supplies</td>';
    tableHTML += '<td class="left"><input class="short-input" type="text" id="supplies-0" name="supplies-0" required />';
    tableHTML += '<button id="add-supply" type="button">Add Supply</button></td></tr></tbody>';
    theTable.innerHTML = tableHTML;
    document.getElementById("add-supply").onclick = () => { addSupplies(); };
}

const initGallery = async () => {
    const fileInput = document.getElementById('file-button');
    const imgPrev = document.getElementById('img-prev');
    let craftArray = await loadCraft();
    let photoGallery = document.getElementById("craft-section");
    clearCraftTable();

    if (craftArray !== undefined && craftArray.length > 0) {
        craftArray.forEach((aCraft) => {
            photoGallery.append(aCraft.renderCraft);
            photoGallery.append(aCraft.expandedSection);
        })
    }
    document.getElementById("icon-add").onclick = () => { modalOpen("add-craft"); };
    document.getElementById("add-craft-cancel").onclick = () => { modalClose("add-craft"); };
    document.getElementById("add-supply").onclick = () => { addSupplies(); };
    document.getElementById("add-crafts-form").reset();
    document.getElementById("img-prev").src = "";

    /* Put the SAVE/submit button back to original state in case it changed during the Edit craft dialog */
    document.getElementById("add-crafts-form").onsubmit = postNewCraft;

    fileInput.addEventListener('change', function () {
        const file = this.files[0]; // Get the selected file
        if (file) {
            const reader = new FileReader(); // Create a new FileReader object
            reader.onload = function (e) {
                imgPrev.src = e.target.result; // Set the image source to the uploaded file's data URL
            }
            reader.readAsDataURL(file); // Read the uploaded file as a data URL            
        } else {
            imgPrev.src = '#'; // Reset the image source if no file is selected
        }
    });
}

/* Handle the POST to create a NEW craft card */
const postNewCraft = async (e) => {
    e.preventDefault();
    const form = document.getElementById("add-crafts-form");
    const formData = new FormData(form);
    const fileInput = document.getElementById('file-button');
    console.log(fileInput.files);  // See if files are being captured on form submission

    formData.append("supplies", getSupplies());
    for (let i = 0; i < getSupplies().length; i++) {
        formData.delete("supplies-" + i);
    }
    let response;

    console.log("in post");
    response = await fetch("/api/crafts", {
        method: "POST",
        body: formData,
    });
    console.log(response);
    modalClose("add-craft");
    document.getElementById("craft-section").innerHTML = "";
    initGallery();
}

/* Handle the PUT to edit/update an existing card */
const putCraft = async (e) => {
    e.preventDefault();
    const form = document.getElementById("add-crafts-form");
    const formData = new FormData(form);
    const fileInput = document.getElementById('file-button');
    console.log(fileInput.files);  // See if files are being captured on form submission
    const craftId = document.getElementById("craft-id").value;
    console.log("PUT: " + craftId);
    formData.append("supplies", getSupplies());
    for (let i = 0; i < getSupplies().length; i++) {
        formData.delete("supplies-" + i);
    }
    let response;

    console.log("in post");
    response = await fetch(`/api/crafts/${craftId}`, {
        method: "PUT",
        body: formData,
    });
    console.log(response);
    modalClose("add-craft");
    document.getElementById("craft-section").innerHTML = "";
    initGallery();
}

const getSupplies = () => {
    const inputs = document.querySelectorAll("#supplies-section input");
    const supplies = [];
    inputs.forEach((input) => {
        if (input.value != "") {
            supplies.push(input.value);
        }
    });

    return supplies;
}

window.onload = () => {
    initGallery();

    if (document.getElementById("add-crafts-form") != null) {
        document.getElementById("add-crafts-form").addEventListener("submit", async function (event) {
            event.preventDefault(); // Prevent default form submission
        });
        document.getElementById("add-crafts-form").onsubmit = postNewCraft;
    }


    const cancelButton = document.getElementById('cancelButton');
    cancelButton.addEventListener('click', () => {
        confirmationDialog.close();
    });

}