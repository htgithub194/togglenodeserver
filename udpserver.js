console.log("START");

var dgram = require('dgram');
var server_UDP = dgram.createSocket("udp4");
server_UDP.bind(8888, () => {
    server_UDP.setBroadcast(true)
});


setInterval(() => {
    server_UDP.send(`get`, 8888, '255.255.255.255');
}, 10000);

setInterval(() => {
    let now = Date.now();
    let isNeedUpdate = false;
    for (let device in ListDevices) {
        if (now - 21000 > device.updateTime) {
            device.status = 'OFF';
            isNeedUpdate = true;
        }
    }

    if (isNeedUpdate) {
        db_updateDevice(device);
    }

}, 10000);

//--------------------------------------------------------------------------//

let ListDevices = [];

function findDeviceById(id) {
    for (let d of ListDevices) {
        if (d.id === id) return d;
    }
    return null;
}

//--------------------------------------------------------------------------//

const firebaseService = require('./firebaseService');
firebaseService.listen('command', command => {
    if (command.type === 'turnon' || command.type === 'turnoff') {
        request8266(command.id, command.type === 'turnon' ? 1 : 0);
    }

    if (command.type === 'turnon_all' || command.type === 'turnoff_all') {
        let status = command.type === 'turnon_all' ? 1 : 0;
        for (let d of ListDevices) {
            request8266(d.id, status);
        }
    }
});

function db_updateDevice() {
    firebaseService.write('devices', ListDevices);
}

//--------------------------------------------------------------------------//
function request8266(id, status) {
    let device = findDeviceById(id);
    if (device) {
        let name = device.id;
        let ip = device.ip;
        // var client = dgram.createSocket('udp4');
        // client.send(`${name} ${status} ${ip}`, 8888, ip);
        server_UDP.send(`${name} ${status} ${ip}`, 8888, ip);
    }
}
//--------------------------------------------------------------------------//

server_UDP.on("message", function (txt, rinfo) {
    var output = "Udp server receive: " + txt + ` from ${rinfo.address}:${rinfo.port}\n`;
    console.log(output);

    let ip = rinfo.address;

    txt += '';

    let listMessage = txt.split('\n');
    listMessage.forEach(e => parse8266UpdateMessage(e, ip));
});

//--------------------------------------------------------------------------//

function parse8266UpdateMessage(message, ip) {
    let spt = message.split(' ');
    let cmd = spt[0];

    console.log(message, ip)

    if (cmd === 'upd') {
        let id = spt[1];
        let status = parseInt(spt[2]) ? 'ON' : 'OFF';

        let isNeedUpdate = false;
        let updateTime = Date.now();
        let device = findDeviceById(id);
        if (!device) {
            isNeedUpdate = true;
            device = { id, status, ip, updateTime };
            ListDevices.push(device);
        } else {
            if (device.status != status) {
                isNeedUpdate = true;
                device.status = status;
            }
        }

        if (isNeedUpdate) {
            db_updateDevice(device);
        }
    }
}