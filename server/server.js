const net = require('net');
const fs = require('fs');
var path = require('path');
var fileName = ""
// var filePath = path.join(__dirname, fileName);
fileIsComming = false
const hostname = '127.0.0.1';
const port = 3000;

// deberia causar problema si varios se conecta a la vez pero equis funciona en  1 caso
// cambiar a path join?
let actual_dir = process.cwd().toString()
var user_server_path = actual_dir


function sendFile(client,fileName){
  // ESTO CHI
  var packages = 0;
  var totalBytes = 0;
  var readStream = fs.createReadStream(actual_dir + '\\' + fileName, {highWaterMark: 16384});
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

    fileIsComming = false
    console.log('file send correctly, fileIsComming set to ' + fileIsComming.toString())
  });

}

const server = net.createServer((socket) => {
  console.log('Connection from', socket.remoteAddress, 'port', socket.remotePort);
  socket.on('data', (data) => {
    console.log('Request from', socket.remoteAddress, 'port', socket.remotePort );

    // client is about to recieve a file MISSING
    // client is about to send a file
    if(fileIsComming){
      console.log('Sign recibied, sending file...')
      sendFile(socket, fileName)
    } else {
      // client isnt sending files
      transformed_data = data.toString().split(',')
      method = transformed_data[0]
    
      switch (method.toLowerCase()) {
        // GET
        case ("get"): {
          fileIsComming = true
          requestedFile = transformed_data[1]
          fileName = requestedFile
          console.log('A file was requested: ' + requestedFile, ' fileIsComming set to: ' + fileIsComming.toString())
          socket.write(JSON.stringify({
            type: 'file_incoming'
          }))
          break;
        };
        // PUT
        case ("put"): {
          fs.writeFile(user_server_path + "\\" + transformed_data[1], transformed_data[2], () => {
            console.log("Successfully Recieved File");
            socket.write(JSON.stringify({
              type: 'put',
              data: `succesfully uploaded file`
            }));
          });
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

  socket.on('end', () => {
    console.log('Closed', socket.remoteAddress, 'port', socket.remotePort);
  });
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