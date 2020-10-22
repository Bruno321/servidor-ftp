const net = require('net');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

const server = net.createServer((socket) => {
  console.log('Connection from', socket.remoteAddress, 'port', socket.remotePort);

  socket.on('data', (buffer) => {
    console.log('Request from', socket.remoteAddress, 'port', socket.remotePort);
    const request = buffer.toString('utf-8');
    const args = request.split(':');

    switch (args[0].toLowerCase()) {
      case ("get"): {
        fs.readFile(args[1], 'utf8', function (err, data) {
          try {
            if (err) throw err;

            socket.write(`${args[1]}:${data}`);
            console.log("Successfully Sent File");
          } catch(e) {
            socket.write(`Could not find filename ${args[1]}`);
            console.log(`Could not find filename ${args[1]}`);
          }
        });
        break;
      };
      case ("put"): {
        fs.writeFile(args[1], args[2], () => {
          console.log("Successfully Recieved File");
          socket.write("Successfully Uploaded File");
        });
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