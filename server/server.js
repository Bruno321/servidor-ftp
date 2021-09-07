const net = require('net');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

// deberia causar problema si varios se conecta a la vez pero equis funciona en  1 caso
let actual_dir = process.cwd().toString()
var user_server_path = actual_dir

const server = net.createServer((socket) => {
  console.log('Connection from', socket.remoteAddress, 'port', socket.remotePort);
  socket.on('data', (buffer) => {
    console.log('Request from', socket.remoteAddress, 'port', socket.remotePort );
    const request = buffer.toString('utf-8');
    // cambiar a algo menos naco
    const args = request.split(',');

    switch (args[0].toLowerCase()) {
      // GET
      case ("get"): {
        // read file pero en este path   
        fs.readFile(user_server_path + "\\" + args[1], 'utf8', function (err, data) {
          try {
            if (err) throw err;

            socket.write(JSON.stringify({
              type: 'get',
              data: `${args[1]}:${data}`
            }));
            console.log("Successfully Sent File");
          } catch(e) {
            socket.write(`Could not find filename ${args[1]}`);
            console.log(`Could not find filename ${args[1]}`);
          }
        });
        break;
      };
      // PUT
      case ("put"): {
        fs.writeFile(user_server_path + "\\" + args[1], args[2], () => {
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
        let dirToMove = args[1]
        let acctualPath = args[2]
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
          // open file
          fs.readdir(user_server_path + '\\' + args[1],[],(err,files)=>{
            files.forEach(file => {
              // delete files
              fs.unlink(user_server_path + '\\' + args[1] + '\\' + file,(err)=>{})
              console.log(file + ' deleted')
            });
          })
          // delete folder
          fs.rmdir(user_server_path + "\\" + args[1],()=>{
            socket.write(JSON.stringify({
              type: 'rmdir',
              data: 'dir succesfuly deleted'
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