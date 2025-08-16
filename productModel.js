import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    id: String,           // or you can omit if you want MongoDB’s _id only
    name: String,
    price: Number,
    image: String,
    alt: String,
    description: String,
    details: String,
    category: String,     // add this if you want to filter by category
    // Add other fields as needed
});

const Product = mongoose.model('Product', productSchema);

export default Product;
