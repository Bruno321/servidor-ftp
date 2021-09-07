const net = require('net');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

const server = net.createServer((socket) => {
  console.log('Connection from', socket.remoteAddress, 'port', socket.remotePort);

  socket.on('data', (buffer) => {
    console.log('Request from', socket.remoteAddress, 'port', socket.remotePort);
    const request = buffer.toString('utf-8');
    // cambiar a algo menos naco
    const args = request.split(':');

    switch (args[0].toLowerCase()) {
      // GET
      case ("get"): {
        fs.readFile(args[1], 'utf8', function (err, data) {
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
        fs.writeFile(args[1], args[2], () => {
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
        break;
      }
      // CD
      case("cd"):{
        break;
      }
      // LS
      case("ls"): {
        // poner si es direcotirio o archivo
        let actual_dir = process.cwd().toString()
        fs.readdir(actual_dir,[],(err,files)=>{
          socket.write(JSON.stringify({
            type: 'ls',
            data: files.toString()
          }))
        })

        break;
      }
      // DELETE
      case("delete"):{
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
        break;
      }
      // PWD
      case ("pwd"):{
        
        let actual_dir = process.cwd().toString()
        socket.write(JSON.stringify({
          type: 'pwd',
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