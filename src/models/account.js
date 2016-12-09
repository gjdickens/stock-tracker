import Mongoose from 'mongoose';
const Schema = Mongoose.Schema;
import PassportLocalMongoose from 'passport-local-mongoose';

const Account = new Schema({
    username: String,
    password: String
});

Account.plugin(PassportLocalMongoose);

module.exports = Mongoose.model('Account', Account);
