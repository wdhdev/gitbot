const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    _id: String,
    avatar_url: String,
    username: String,
    email: String,
    token: String
})

module.exports = mongoose.model("users", schema, "users")