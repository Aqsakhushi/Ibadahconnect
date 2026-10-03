const mongoose = require('mongoose');
const PackageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  desc: { type: String, required: true },
  category: { type: String, enum: ['Umrah Badal', 'Hajj Badal'], required: true },
  image: { type: String, required: true }
}, { timestamps: true });
module.exports = mongoose.model('Package', PackageSchema);