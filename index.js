const { SerialPort } = require("serialport");

const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);

// Replace with your device port name and baud rate
const portName = "/dev/ttyUSB0";
const baudRate = 115200;
const serialPort = new SerialPort({
  path: portName,
  baudRate: baudRate,
});

serialPort.on("data", (data) => {
  const message = data.toString();
  // console.log("Received data:", message);
  mapData = 51.51 + "::" + -0.09;
  io.emit("serialData", mapData); // Emit data to connected clients
});

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
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
