const net = require('net');
const fs = require('fs');
var path = require('path');
var requestedFiles = []
var fileName = ""
fileToWriteName = ""
// var filePath = path.join(__dirname, fileName);
fileIsAboutToBeSend = false
fileIsAboutToBeRecieved = false
const hostname = '127.0.0.1';
const port = 3000;

var packets = 0;
var buffer = new Buffer(0);

// deberia causar problema si varios se conecta a la vez pero equis funciona en  1 caso
// cambiar a path join?
let actual_dir = process.cwd().toString()
var user_server_path = actual_dir


function sendFile(client,fileName){
  // ESTO CHI
  var packages = 0;
  var totalBytes = 0;
  console.log('VERGOTAOTOAOTAO',user_server_path + '\\' + fileName)
  var readStream = fs.createReadStream(user_server_path + '\\' + fileName, {highWaterMark: 16384});
  readStream.on('data', function(chunk){
    packages++;    
    var head = new Buffer("FILE");
    var sizeHex = chunk.length.toString(16);
    while(sizeHex.length < 4){
      sizeHex = "0" + sizeHex;
    }
    var size = new Buffer(sizeHex);
    console.log("size", chunk.length, "hex", sizeHex);
    var delimiter = new Buffer("@");
    var pack = Buffer.concat([head, size, chunk, delimiter]);
    totalBytes += pack.length;
    client.write(pack);
  });

  readStream.on('close', function(){
    // cierra la conexion, porq?
    client.end();
    console.log("total packages", packages);
    console.log("total bytes sent", totalBytes);

    if(requestedFiles.length>0){
      // se queda
      requestedFiles.shift()
      console.log('faltan',requestedFiles,fileIsAboutToBeSend)
    }else{
      console.log('eso es todo we')
      fileIsAboutToBeSend = false
    }
    console.log('file send correctly, fileIsAboutToBeSend set to ' + fileIsAboutToBeSend.toString())
  });

}

function recibirArchivo(data){
  packets++;
  console.log(data);
  buffer = Buffer.concat([buffer, data]);
}

const server = net.createServer((socket) => {
  console.log('Connection from', socket.remoteAddress, 'port', socket.remotePort);
  socket.on('data', (data) => {
    console.log('Request from', socket.remoteAddress, 'port', socket.remotePort );
    console.log(data)
    // client is about to recieve a file MISSING
    // client is about to send a file
    if(fileIsAboutToBeSend){
      console.log('Sign recibied, sending file...')
      if(requestedFiles.length>0){
        fileName = requestedFiles[0]
      }
      sendFile(socket, fileName)
    } else if(fileIsAboutToBeRecieved){
      console.log('Recibing file...')
      recibirArchivo(data)
    }else {
      // client isnt sending files
      transformed_data = data.toString().split(',')
      method = transformed_data[0]
    
      switch (method.toLowerCase()) {
        // GET
        case ("get"): {
          requestedFile = transformed_data[1]
          fileName = requestedFile
          // check that the file exists
          // get files on dir
          fs.readdir(user_server_path,[],(err,files)=>{
            // compare
            if(files.includes(fileName)){
              // the file exist
              fileIsAboutToBeSend = true
              console.log('A file was requested: ' + requestedFile, ' fileIsAboutToBeSend set to: ' + fileIsAboutToBeSend.toString())
              socket.write(JSON.stringify({
                type: 'file_incoming'
              }))
            }else{
              // the file doest not exist
              socket.write(JSON.stringify({
                type: 'get',
                data: 'the file does not exist'
              }))
            }
          })
          
          break;
        };
        // PUT
        case ("put"): {
          fileToWriteName = transformed_data[1]
          fileIsAboutToBeRecieved = true
          console.log('A file is about to be recieved, fileIsAboutToBeRecieved set to: ' + fileIsAboutToBeRecieved.toString())
          socket.write('r')
          break;
        }
        // LCD
        case("lcd"):{
          socket.write(JSON.stringify({
            type: 'lcd',
            data: 'a'
          }))
          break;
        }
        // CD
        case("cd"):{
          let dirToMove = transformed_data[1]
          let acctualPath = transformed_data[2]
          let completePath = `${acctualPath}\\${dirToMove}`
          // checar que el path exista
          fs.readdir(completePath,[],(err,files)=>{
            if(files==undefined){
              socket.write(JSON.stringify({
                type: 'cd',
                data: 'este directorio no existe'
              }))
            }else{
              user_server_path = completePath
              socket.write(JSON.stringify({
              type: 'cd',
              data: 'you are now on: ' + user_server_path
            }))
          }
          })
          break;
        }
        // LS
        case("ls"): {
          // poner si es direcotirio o archivo
          fs.readdir(user_server_path,[],(err,files)=>{
            socket.write(JSON.stringify({
              type: 'ls',
              data: files.toString()
            }))
          })
  
          break;
        }
        // DELETE
        case("delete"):{
  
          if(args[1]=='-R'){
            fs.rm(user_server_path + '\\' + args[2],{recursive:true, force:true},()=>{
              socket.write(JSON.stringify({
                type: 'delete',
                data: 'dir succesfully deleted'
              }))
            })
          }else{
            fs.unlink(user_server_path + '\\' + args[1],(err)=>{
              try {
                if (err) throw err
                console.log('succesfully deleted file')
                socket.write(JSON.stringify({
                  type: 'delete',
                  data: 'succesfully deleted file'
                }))
              } catch (e) {
                console.log('files doest not exist')
                socket.write(JSON.stringify({
                  type: 'delete',
                  data: 'file doest not exist'
                }))
              }
            })
          }
          break;
        }
        // MPUT
        case("mput"):{
          break;
        }
        // MGET
        case("mget"):{
          filesCheck = 0
          transformed_data.shift()
          requestedFiles = transformed_data
          console.log('files requested: ',requestedFiles)
          // check that the file exists
          // get files on dir
          fs.readdir(user_server_path,[],(err,files)=>{
            requestedFiles.forEach((file)=>{
              if(files.includes(file)){
                // exist
                filesCheck++
              }
            })

            if(filesCheck===requestedFiles.length){
              // si existe
              console.log('Preparing to send file')
              fileIsAboutToBeSend = true
              fileName = requestedFiles[0]
              socket.write(JSON.stringify({
                type: 'files_incoming'
              }))
            }else{
              console.log('some file dosent exist')
              socket.write(JSON.stringify({
                type: 'mget',
                data: 'some file dosent exist'
              }))
            }
          })
          break;
        }
        // RMDIR
        case("rmdir"):{
          fs.readdir(user_server_path + "\\" + args[1] ,[],(err,files)=>{
            if(files.length > 0){
              socket.write(JSON.stringify({
                type: 'rmdir',
                data: 'The directory isnt empty'
              }))
            }else{
              fs.rmdir(user_server_path + "\\" + args[1],()=>{
                socket.write(JSON.stringify({
                  type: 'rmdir',
                  data: 'dir succesfuly deleted'
                }))
              })
            }
          })
          break;
        }
        // PWD
        case ("pwd"):{
          
          socket.write(JSON.stringify({
            type: 'pwd',
            data: user_server_path
          }));
          break;
        }
        case("initial_state"):{
          
          let actual_dir = process.cwd().toString()
          socket.write(JSON.stringify({
            type: 'initial_state',
            data: actual_dir
          }));
          break;
        }
        
      }

    }

  });

  socket.on('close',()=>{

    // fake closing
    if(fileIsAboutToBeRecieved){

      console.log("total packages", packets);
      // write data
      var writeStream = fs.createWriteStream(user_server_path + '\\' + fileToWriteName,{emitClose:true});
      console.log("buffer size", buffer.length);
      while(buffer.length){
        var head = buffer.slice(0, 4);
        console.log("head", head.toString());
        if(head.toString() != "FILE"){
          // no siempre puede significar error
          console.log("ERROR!!!!");
          process.exit(1);
        }
        
        var sizeHex = buffer.slice(4, 8);
        var size = parseInt(sizeHex, 16);

        console.log("size", size);

        var content = buffer.slice(8, size + 8);
        var delimiter = buffer.slice(size + 8, size + 9);
        console.log("delimiter", delimiter.toString());
        if(delimiter != "@"){
          console.log("wrong delimiter!!!");
          process.exit(1);
        }

        writeStream.write(content);
        buffer = buffer.slice(size + 9);
      }

      setTimeout(function(){
        writeStream.end();
      }, 2000);

      writeStream.on('close',()=>{
        console.log('File saved correctly')
        fileIsAboutToBeRecieved = false
        console.log('Restarting connection...' , ' fileIsAboutToBeRecieved set to ' + fileIsAboutToBeRecieved.toString())
        // reinicar conexion?  
        socket.connect(5000, "127.0.0.1");
        socket.write('pito')
      })
    } else {
      // true closing
      console.log("\n");
      console.log("CONNECTION ENDED");
    }
  })

  // socket.on('end', () => {
  //   console.log('Closed', socket.remoteAddress, 'port', socket.remotePort);
  // });
});

server.listen(port, hostname, () => {
  console.log(`%c
███████╗███╗   ██╗ █████╗ ███████╗███████╗██╗   ██╗    ███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗ 
██╔════╝████╗  ██║██╔══██╗╚══███╔╝╚══███╔╝╚██╗ ██╔╝    ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗
███████╗██╔██╗ ██║███████║  ███╔╝   ███╔╝  ╚████╔╝     ███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝
╚════██║██║╚██╗██║██╔══██║ ███╔╝   ███╔╝    ╚██╔╝      ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗
███████║██║ ╚████║██║  ██║███████╗███████╗   ██║       ███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║
╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝       ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝
                                                                                                        
`, "font-family:monospace")
  console.log(`Running at http://${hostname}:${port}/`);
});