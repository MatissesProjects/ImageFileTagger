from flask import Flask, jsonify, render_template, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/test.db'
db = SQLAlchemy(app)

class Image(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), unique=True, nullable=False)

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), unique=True, nullable=False)
    count = db.Column(db.Integer, default=1)

class ImageTag(db.Model):
    image_id = db.Column(db.Integer, db.ForeignKey('image.id'), primary_key=True)
    tag_id = db.Column(db.Integer, db.ForeignKey('tag.id'), primary_key=True)

@app.route('/api/images', methods=['GET'])
def get_images():
    images = Image.query.all()
    return jsonify([{"id": image.id, "name": image.name} for image in images])

@app.route('/images/<path:filename>')
def serve_image(filename):
    return send_from_directory(os.path.join(app.root_path, 'images'), filename)

@app.route('/api/images/<image_id>/tags', methods=['GET'])
def get_tags_for_image(image_id):
    image = Image.query.get(image_id)
    if image is None:
        return jsonify({"error": "Image not found"}), 404
    else:
        tags = Tag.query.join(ImageTag).filter(ImageTag.image_id == image.id).order_by(Tag.name).all()
        return jsonify([tag.name for tag in tags])

@app.route('/api/tags', methods=['GET', 'POST'])
def handle_tags():
    if request.method == 'POST':
        image_id = request.json.get('image_id')
        tag_name = request.json.get('tag_name')
        image = Image.query.get(image_id)
        if image is None:
            return jsonify({"error": "Image not found"}), 404
        tag = Tag.query.filter_by(name=tag_name).first()
        if tag is None:
            tag = Tag(name=tag_name)
            db.session.add(tag)
            db.session.commit()  # commit here to make sure tag has an ID for the next step
        else:
            tag.count += 1
        image_tag = ImageTag.query.filter_by(image_id=image_id, tag_id=tag.id).first()
        if image_tag is not None:
            return jsonify({"message": "Tag already added to this image"}), 409
        image_tag = ImageTag(image_id=image_id, tag_id=tag.id)
        db.session.add(image_tag)
        db.session.commit()
        return jsonify({"message": "Tag added successfully"}), 201
    else:
        tags = Tag.query.order_by(Tag.count.desc(), Tag.name).all()
        return jsonify([{"id": tag.id, "name": tag.name, "count": tag.count} for tag in tags])

@app.route('/api/images/<image_id>/tags/<tag_name>', methods=['DELETE'])
def delete_tag_from_image(image_id, tag_name):
    image = Image.query.get(image_id)
    if image is None:
        return jsonify({"error": "Image not found"}), 404
    tag = Tag.query.filter_by(name=tag_name).first()
    if tag is None:
        return jsonify({"error": "Tag not found"}), 404
    image_tag = ImageTag.query.filter_by(image_id=image_id, tag_id=tag.id).first()
    if image_tag is None:
        return jsonify({"error": "Tag is not associated with this image"}), 404
    db.session.delete(image_tag)
    tag.count -= 1
    if tag.count == 0:
        db.session.delete(tag)
    db.session.commit()
    return jsonify({"message": "Tag removed successfully"}), 200

@app.route('/api/images_with_tags', methods=['GET'])
def get_images_with_tags():
    images = Image.query.all()
    images_with_tags = []
    for image in images:
        tags = Tag.query.join(ImageTag).filter(ImageTag.image_id == image.id).all()
        tag_names = [tag.name for tag in tags]
        images_with_tags.append({"name": image.name, "tags": tag_names})
    return jsonify(images_with_tags)

@app.route('/api/saveToDisk')
def saveToDisk():
    with open("C:/Users/matis/Downloads/images_with_tags.csv", "r") as f:
        data = f.readlines()
    for l in data:
        old_name, line = l.split(" - ")
        line = line[:-1]
        new_name = f"{line}{old_name[old_name.find('.'):]}"
        
        # Update the image record in the database
        image = Image.query.filter_by(name=old_name).first()
        if image is None:
            print(f"No image found with name {old_name}")
            continue
        image.name = new_name
        db.session.commit()

        # Rename the file
        os.rename(f"images/{old_name}", f"images/{new_name}")

    os.remove("C:/Users/matis/Downloads/images_with_tags.csv")
    return "success"

@app.route('/api/refresh_images', methods=['GET'])
def refresh_images():
    images_dir = os.path.join(app.root_path, 'images')
    # image_filenames = os.listdir(images_dir)
    image_filenames = [f for f in os.listdir(images_dir) if f != '.gitkeep']

    # Get current image names in the database
    current_db_images = {img.name for img in Image.query.all()}

    # Get current image names in the images directory
    current_dir_images = set(image_filenames)

    # Find the images to add and to delete
    images_to_add = current_dir_images - current_db_images
    images_to_delete = current_db_images - current_dir_images

    # Delete the images that are in the database but not in the images directory
    for img_name in images_to_delete:
        img = Image.query.filter_by(name=img_name).first()
        if img:
            db.session.delete(img)

    # Add the new images that are in the images directory but not in the database
    for img_name in images_to_add:
        new_image = Image(name=img_name)
        db.session.add(new_image)

    db.session.commit()

    return jsonify(list(current_dir_images))


@app.route('/style.css')
def style():
    return send_from_directory(".", "./static/style.css")

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Populate the Image table with images from the /images directory
        images_dir = os.path.join(app.root_path, 'images')
        for filename in os.listdir(images_dir):
            if filename == '.gitkeep':   # Ignore .gitkeep file
                continue
            if not Image.query.filter_by(name=filename).first():
                new_image = Image(name=filename)
                db.session.add(new_image)
        db.session.commit()

    app.run(port=5000, debug=True)
