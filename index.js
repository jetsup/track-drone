const { SerialPort } = require("serialport");

const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use("/js", express.static(__dirname + "/node_modules/"));

let BASE_LAT, BASE_LON, BASE_ALT;

// Replace with your device port name and baud rate
const portName = "/dev/ttyUSB1";
const baudRate = 115200;
const serialPort = new SerialPort({
  path: portName,
  baudRate: baudRate,
});
let serialBuffer = "";
serialPort.on("data", (data) => {
  serialBuffer += data.toString(); // Append incoming data to the buffer

  const newlineIndex = serialBuffer.indexOf("\n");
  if (newlineIndex !== -1) {
    try {
      const message = serialBuffer
        .slice(0, newlineIndex)
        .replace("<$", "")
        .replace("#>", "");
      // serialBuffer.replace("<$", "").replace("#>", "");
      console.log("%%>", message);
      serialBuffer = serialBuffer.slice(newlineIndex + 1);

      // base data|dynamic data
      let base = message.split("|")[0].split(",");
      BASE_LAT = Number(base[0]);
      BASE_LON = Number(base[1]);
      BASE_ALT = Number(base[2]);
      let msgArray = message.split("|")[1].split(",");

      console.log("Received data:", ...msgArray, ":BASE:", ...base);

      if (msgArray.length < 5) {
        return;
      }

      let lat = parseFloat(msgArray[0]);
      let lon = parseFloat(msgArray[1]);
      let mTime = msgArray[2];
      let alt = parseFloat(msgArray[3]);
      let speed = parseFloat(msgArray[4]);
      let course = parseFloat(msgArray[5]);
      let distance = parseFloat(msgArray[6]);
      // io.emit("serialData", { lat, lon, alt, speed, mTime, distance }); // Emit data to connected clients
      io.emit("serialData", [
        {
          lat: lat,
          lng: lon,
          baseLat: BASE_LAT,
          baseLng: BASE_LON,
          mTime: mTime,
          alt: alt,
          baseAlt: BASE_ALT,
          speed: speed,
          course: course,
          distance: distance,
        },
      ]); // Emit data to connected clients

      serialBuffer = "";
    } catch (error) {
      console.log("Error parsing data:", error.message);
    }
  }
});

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "views/index.html"));
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
