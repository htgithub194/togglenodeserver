var firebase = require("firebase/app");
require("firebase/database");

var config = {
    apiKey: "AIzaSyAf8QjS5akOQkbtfrDFueh8oF42OjKr26Q",
    databaseURL: "https://tinihouse.firebaseio.com/",
};

firebase.initializeApp(config);
var db = firebase.database();

function write(path, data) {
    // console.log('fb write\n', path, data);

    try {
        db.ref(path).set(data);
    } catch (error) {
        console.log(error);
    }
}

function listen(path, callback) {
    try {
        let ref = db.ref(path);
        ref.on('value', (data) => callback(data.val()));
    } catch (error) {
        console.log(error);
    }

}

module.exports = {
    write,
    listen
}