const imageSelect = document.getElementById('imageSelect');
const previousButton = document.getElementById('previousButton');
const nextButton = document.getElementById('nextButton');
const tagInput = document.getElementById('tagInput');
const addTagButton = document.getElementById('addTagButton');
const allTags = document.getElementById('allTags');
let suggestions = document.getElementById("suggestions");

async function fetchImages() {
    const response = await fetch('http://localhost:5000/api/images');
    const images = await response.json();
    images.forEach((image, index) => {
        const option = document.createElement('option');
        option.value = image.id;
        option.textContent = image.name;
        option.dataset.url = `http://localhost:5000/images/${image.name}`;
        imageSelect.appendChild(option);
    });

    // Initialize the first image
    if (images.length > 0) {
        imageSelect.selectedIndex = 0; // Ensure the first image is selected
        imageSelect.dispatchEvent(new Event('change')); // Trigger the 'change' event manually for the first image
    }
}
async function fetchTagsForImage(imageId) {
    // Get the tag container and clear it out
    const tagContainer = document.getElementById('tagsContainer');
    tagContainer.innerHTML = '';

    // Fetch tags
    const response = await fetch(`http://localhost:5000/api/images/${imageId}/tags`);
    const tags = await response.json();
    tags.forEach(tag => {
        const tagElement = document.createElement('button');
        tagElement.textContent = tag;
        tagElement.addEventListener('click', function() {
            deleteTag(imageId, tag);
        });
        tagContainer.appendChild(tagElement);
    });
}

async function deleteTag(imageId, tagName) {
    const response = await fetch(`http://localhost:5000/api/images/${imageId}/tags/${tagName}`, {
        method: 'DELETE',
    });
    const result = await response.json();
    if (result.error) {
        alert(result.error);
    } else {
        fetchTagsForImage(imageId);
        fetchAllTags();
    }
}


async function fetchAllTags() {
    const response = await fetch('http://localhost:5000/api/tags');
    const tags = await response.json();
    allTags.innerHTML = '';
    tags.forEach(tag => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = `${tag.name} (${tag.count})`;
        button.addEventListener('click', function() {
            const selectedOption = imageSelect.options[imageSelect.selectedIndex];
            addTag(selectedOption.value, tag.name);
        });
        li.appendChild(button);
        allTags.appendChild(li);
    });
}

async function addTag(imageId, tagName) {
    const response = await fetch('http://localhost:5000/api/tags', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image_id: imageId, tag_name: tagName })
    });
    const result = await response.json();
    if (result.error) {
        alert(result.error);
    } else {
        fetchTagsForImage(imageId);
        fetchAllTags();
    }
}

imageSelect.addEventListener('change', function() {
    const selectedOption = this.options[this.selectedIndex];
    document.getElementById('selectedImage').src = selectedOption.dataset.url;
    fetchTagsForImage(selectedOption.value);
});

addTagButton.addEventListener('click', function() {
    const selectedOption = imageSelect.options[imageSelect.selectedIndex];
    addTag(selectedOption.value, tagInput.value);
});

previousButton.addEventListener('click', function() {
    const currentIndex = imageSelect.selectedIndex;
    if (currentIndex > 0) {
        imageSelect.selectedIndex = currentIndex - 1;
        imageSelect.dispatchEvent(new Event('change'));
    }
});

nextButton.addEventListener('click', function() {
    const currentIndex = imageSelect.selectedIndex;
    if (currentIndex < imageSelect.options.length - 1) {
        imageSelect.selectedIndex = currentIndex + 1;
        imageSelect.dispatchEvent(new Event('change'));
    }
});

async function downloadImagesWithTags() {
    // Fetch the images with their tags
    const response = await fetch('http://localhost:5000/api/images_with_tags');
    const imagesWithTags = await response.json();
    
    // Format the data
    const dataString = imagesWithTags.map(image => `${image.name} - ${image.tags.join(', ')}`).join('\n');
        
    // Create a Blob with the data
    const blob = new Blob([dataString], { type: 'text/csv' });
    
    // Create an object URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a link element
    const link = document.createElement('a');
    link.href = url;
    link.download = 'images_with_tags.csv';
    
    // Simulate a click on the link to start the download
    link.click();
    
    // Release the object URL
    URL.revokeObjectURL(url);

    const saveResponse = await fetch('http://localhost:5000/api/saveToDisk');
    const saved = await saveResponse.text();
}

// Attach the function to a button
const downloadButton = document.getElementById('downloadButton');
downloadButton.addEventListener('click', downloadImagesWithTags);

tagInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission which refreshes the page
        const selectedOption = imageSelect.options[imageSelect.selectedIndex];
        addTag(selectedOption.value, tagInput.value);
        tagInput.value = ''; // Clear the input field
    }
});

addTagButton.addEventListener('click', function() {
    const selectedOption = imageSelect.options[imageSelect.selectedIndex];
    addTag(selectedOption.value, tagInput.value);
    tagInput.value = ''; // Clear the input field
});

const refreshButton = document.getElementById('refreshButton');

refreshButton.addEventListener('click', async function() {
    const response = await fetch('http://localhost:5000/api/refresh_images');
    const imageFilenames = await response.json();

    // Clear out the dropdown
    imageSelect.innerHTML = '';

    // Re-add the options to the dropdown
    imageFilenames.forEach((imageName, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = imageName;
        option.dataset.url = `http://localhost:5000/images/${imageName}`;
        imageSelect.appendChild(option);
    });

    // Select the first image and fetch its tags
    if (imageFilenames.length > 0) {
        imageSelect.selectedIndex = 0; 
        imageSelect.dispatchEvent(new Event('change')); 
    }
});

tagInput.addEventListener("input", function () {
    let value = tagInput.value;
    if (!value) {
        suggestions.innerHTML = '';
        return;
    }
    fetch(`/api/suggest_tags?prefix=${value}`)
    .then(response => response.json())
    .then(data => {
        suggestions.innerHTML = '';
        if (data.length > 0) {
            suggestions.style.display = 'block';  // show suggestions
        } else {
            suggestions.style.display = 'none';  // hide suggestions
        }
        for (let i = 0; i < data.length; i++) {
            let li = document.createElement("li");
            li.textContent = data[i];
            li.addEventListener("click", function () {
                tagInput.value = data[i];
                suggestions.innerHTML = '';
                suggestions.style.display = 'none';  // hide suggestions
                tagInput.value = data[i];
                document.getElementById('suggestions').innerHTML = '';
                document.getElementById('suggestions').style.display = 'none';  // hide suggestions
                document.getElementById('tagInput').focus();  // focus the text box
            });
            suggestions.appendChild(li);
        }
    });
});

fetchImages();
fetchAllTags();

document.getElementById('tagInput').addEventListener('input', function() {
    if (this.value === '') {
        document.getElementById('suggestions').style.display = 'none';  // hide suggestions
    }
});
