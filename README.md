# Image Tagging Web Application

A simple yet effective web application to assign tags to images. Build for tagging images for machine learning datasets for [fileword] generation. It is built with Python Flask, JavaScript, HTML, and CSS. 

## Table of Contents
- [Introduction](#introduction)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Example View](#example-view)

## Introduction
The Image Tagging Web Application allows users to assign tags to images, with features including browsing through images, adding or removing tags, viewing all available tags, and exporting the list of images and their corresponding tags. It's a great tool for those who want to manage their image datasets efficiently.

## Getting Started
### Prerequisites
- Python 3.x
- Flask
- Flask-SQLAlchemy

### Installation
1. Install the required Python packages
`pip install flask flask_sqlalchemy`
2. Run the application
`python app.py`

4. Open a web browser and visit http://localhost:5000

## Usage
1. **Image selection**: Use the dropdown menu to select the desired image. Or use the previous next buttons.
2. **Adding tags**: Enter a tag in the input box and either press Enter or click on the "Add Tag" button. The newly added tag will be displayed under the input box.
3. **Removing tags**: Click on a tag button under the input box to remove the tag from the selected image.
4. **Viewing all tags**: All available tags are displayed on the right side of the screen. Click on a tag to add it to the selected image.
5. **Exporting**: Click on the "Export Images With Tags" button to export all images with their tags. The images will be saved with their tag names.
6. **Refreshing**: Click on the "Refresh Images" button to refresh the list of images from the server.

## Example view
![image](https://github.com/MatissesProjects/ImageFileTagger/assets/3753211/06eb7d3c-d072-471c-80a1-aba841a8a26e)
