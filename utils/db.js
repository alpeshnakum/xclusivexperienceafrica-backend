const { default: mongoose } = require("mongoose");

const db = () => {
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    mongoose.connection
        .once("open", () => console.log("Database Connected."))
        .on("error", (error) => {
            console.log(`Error : ${error}`);
        });
    return mongoose;
};

module.exports = db;

