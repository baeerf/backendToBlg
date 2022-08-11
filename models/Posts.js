const mongoose = require("mongoose");

const Messages = mongoose.model("Messages", {
  name: String,
  idFrom: String,
  msg: String,
});

module.exports = Messages;
