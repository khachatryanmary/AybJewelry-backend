import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    id: String,
    name: String,
    price: String,
    image: String,
    alt: String,
    description: String,
    category: String,
    details: [{}],       // or just type: Array
    images: [String]     // optional
});

const Product = mongoose.model('Product', productSchema);
export default Product;
``