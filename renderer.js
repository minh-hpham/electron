const zerorpc = require("zerorpc")
let client = new zerorpc.Client()

client.connect("tcp://127.0.0.1:4242")

client.invoke("echo", "server ready", (error, res) => {
  if(error || res !== 'server ready') {
    console.error(error)
  } else {
    console.log("server is ready")
  }
})

const electron = require('electron');
var fs = require('fs');


client.invoke("proc", electron.remote.getGlobal('sharedObject').APP_INFO_PATH, (error, res) => {
    if(error) {
      console.error(error)
    } else {
      console.log(JSON.parse(JSON.strigify(res.subjects)));   
    }
})

//let formula = document.querySelector('#formula')
//let result = document.querySelector('#result')
//
//formula.addEventListener('input', () => {
//
//})
//
//formula.dispatchEvent(new Event('input'))
