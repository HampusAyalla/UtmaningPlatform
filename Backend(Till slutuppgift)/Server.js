var express = require("express");
var cors = require("cors");
var fs = require("fs");

var app = express();

app.use(cors());
app.use(express.json());