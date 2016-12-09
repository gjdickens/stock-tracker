import Mongoose from 'mongoose';
const Schema = Mongoose.Schema;

const Bar = new Schema({
    bar_id: String,
    username: String,
    timestamp: Date
});

module.exports = Mongoose.model('Bar', Bar);
