const { Socket } = require('net');
const readline = require("readline");
const fs = require('fs');

// TODO : cambiar todos los write a algo menos naco tambien
var server_path = ''

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// External Handlers
const handleEnterCommand = () => {
  rl.question("Enter A Command [OPEN, GET, PUT, CLOSE, QUIT, PWD, LS, CD]: ", (command) => {
    client.setCommand(command);
    client.mainLoop();
  })
}
const verifyAnswer = (initialValue) => {
  if (client.port === 0) {
    rl.question(`Is this correct? [Y/N]:`, (value) => {
      switch (value.toLowerCase()) {
        case ('y'): {
          client.setPort(initialValue);
          console.log(`You've Selected Port: ${client.port}`);
          client.mainLoop();
        }
        case ('n'): {
          handlePortEntry();
        }
        default: {
          verifyAnswer(initialValue);
        }
      }
    })
  }
}
const handlePortEntry = () => {
  if (client.port === 0) {
    console.log(`Which Port would you like to connect to?`);
    rl.question("Enter Port Number: ", (port) => {
      if (port.length !== 4 || isNaN(parseInt(port))) {
        console.log("The port must be of type number and of length 4. Please try again.");
        handlePortEntry();
      } else {
        verifyAnswer(port);
      }
    })
  }
}

// MAIN CLASS
class Client {
  host = '127.0.0.1';
  port = 0;
  loop = true;
  processing = false;
  shouldSetup = true;
  command = "";
  socket = new Socket();

  // INSTANTIATE SOCKET LISTENERS
  constructor() {
    this.setSocketListeners();

    // STARTUP ASCII ART BC I'M SUPER COOL
    console.log(`%c
    ███████╗███╗   ██╗ █████╗ ███████╗███████╗██╗   ██╗     ██████╗██╗     ██╗███████╗███╗   ██╗████████╗
    ██╔════╝████╗  ██║██╔══██╗╚══███╔╝╚══███╔╝╚██╗ ██╔╝    ██╔════╝██║     ██║██╔════╝████╗  ██║╚══██╔══╝
    ███████╗██╔██╗ ██║███████║  ███╔╝   ███╔╝  ╚████╔╝     ██║     ██║     ██║█████╗  ██╔██╗ ██║   ██║   
    ╚════██║██║╚██╗██║██╔══██║ ███╔╝   ███╔╝    ╚██╔╝      ██║     ██║     ██║██╔══╝  ██║╚██╗██║   ██║   
    ███████║██║ ╚████║██║  ██║███████╗███████╗   ██║       ╚██████╗███████╗██║███████╗██║ ╚████║   ██║   
    ╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝        ╚═════╝╚══════╝╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   
                                                                                                         
    `, "font-family:monospace")

    console.log(`Welcome to Calham's snazzy FTP client, we will be connecting to host ${this.host}`);
  }

  // HANDLERS
  setPort(number) {
    this.port = number;
  }
  setCommand(value) {
    this.command = value;
  }
  setSetupComplete(value) {
    this.setSetupComplete = value;
  }

  handleClose() {
    console.log("CLOSING");
    this.socket.destroy();
  }

  // GET
  handleGet() {
    rl.question("Enter The Filename To Retrieve: ", (value) => {
      if (!value.includes(".txt")) {
        console.log("You have entered an invalid file type. Files must be of type <filename>.txt");
        this.setCommand("");
        this.mainLoop();
      } else {
        this.socket.write(`GET:${value}`);
      }
    })
  }
  
  // PUT
  handlePut() {
    rl.question("Enter The Filename To Transmit: ", (value) => {
      if (!value.includes(".txt")) {
        console.log("You have entered an invalid file type. Files must be of type <filename>.txt");
      } else {
        const transmit = (data) => {
          this.socket.write(`PUT:${value}:${data}`);
        }
        const handleError = () => {
          this.setCommand("");
          this.mainLoop();
        }
        fs.readFile(value, 'utf8', function (err, data) {
          try {
            if (err) throw err;
            transmit(data);
          } catch (e) {
            console.log(`Error reading file: ${value}`);
            handleError()
          }
        });
      }
    });
  }
  
  // LCD
  handleLcd(){

  }

  // CD
  handleCd(){
    rl.question("Enter the directory name in which you want to move: ", (value)=>{
      this.socket.write(`CD:${value}`)
    })
  }

  // LS
  handleLs(){
    this.socket.write("LS")
  }

  // DELETE
  handleDelte(){

  }

  // MPUT
  handleMput(){

  }

  // MGET
  handleMget(){

  }

  // RMDIR
  handleRmdir(){

  }

  // PWD
  handlePwd(){
    this.socket.write("PWD")
  }

  // QUIT CLIENT
  quitClient() {
    this.socket.end();
  }

  // borrar despues
  handleOpen() {
    if (this.port !== 0) {
      try {
        this.socket.connect(this.port, this.host);
      } catch(e) {
        console.log("Couldn't Attempt Connection");
      }
    } else {
      handlePortEntry();
    }
  }

  mainLoop() {
    // STATE CONTROLLER
    if (this.command !== "") {
      switch (this.command.toLowerCase()) {
        case ("close"): { this.handleClose(); break; }
        case ("get"): { this.handleGet(); break; }
        case ("put"): { this.handlePut(); break; }
        // falta
        case ("lcd"): {this.handleLcd();break;}
        // falta
        case ("cd"): {this.handleCd();break;}
        case ("ls"): {this.handleLs();break;}
        // falta
        case ("delete"): {this.handleDelte();break;}
        // falta
        case ("mput"): {this.handleMput();break;}
        // falta
        case ("mget"): {this.handleMget();break;}
        // falta
        case ("rmdir"): {this.handleRmdir();break;}
        case ("pwd"): {this.handlePwd();break;}
        case ("quit"): { this.handleQuit(); break; }
        //borrar despues
        case ("open"): { this.handleOpen(); break; }
        default: {
          console.log(`The command, "${this.command}", is invalid. Please try again.`);
          handleEnterCommand();
          break;
        }
      }
    } else {
      handleEnterCommand();
    }
  }

  // Set Listeners Used By Socket
  setSocketListeners() {
    this.socket.on("connect", () => {
      console.log('\n');
      console.log("---Successfully connected to---");
      console.log("-------------------------------");
      console.log(`HOST: ${this.host}`);
      console.log(`PORT: ${this.port}`);
      console.log("-------------------------------");
      console.log('\n');
      this.setCommand("");
      this.mainLoop();
    });
    this.socket.on('error', () => {
      console.log('\n');
      console.log("---ERROR CONNECTING TO---");
      console.log("-------------------------------");
      console.log(`HOST: ${this.host}`);
      console.log(`PORT: ${this.port}`);
      console.log("-------------------------------");
      console.log('\n');
      this.socket = new Socket();
      this.setSocketListeners();
      this.setCommand("");
      this.setPort(0);
      this.mainLoop();
    });

    // AQUI VA QUE HACER CON CADA RESPUESTA
    this.socket.on("data", (data) => {
      // TODO : cambiar a swich case
      try {
        const raw_response = data.toString('utf-8');
        const response = JSON.parse(raw_response)
        // console.log(response.data)
        // GET RESPONSE
        if (response.type == 'get') {
          try {
            
            const raw_args = response.data
            const args = raw_args.split(":");
            fs.writeFileSync(args[0], args[1]);
            console.log(`Successfully recieved and saved file: ${args[0]}`);
          } catch (e) { console.log("Could not write the incoming file to local file system.") }
        } else if(response.type == 'put'){
          // PUT RESPONSE
          console.log(response.data);
        }  else if (response.type == 'lcd'){
          // LCD RESPONSE
        } else if (response.type == 'cd'){
          // CD RESPONSE
        } else if (response.type == 'delete'){
          // DELETE RESPONSE
        } else if (response.type == 'mput'){
          // MPUT RESPONSE
        }  else if (response.type == 'mget'){
          // MGET RESPONSE
        } else if (response.type == 'rmdir'){
          // CD RESPONSE
        } else if(response.type == 'pwd'){
          // PWD RESPONSE
          console.log(response.data)
        }else if (response.type == 'ls'){
          // LS RESPONSE
          // TODO : si el archivo tiene comas en su nombre esto ya valio
          let list = response.data.split(",")
          list.forEach(file => {
            console.log(file)
          });
        }

      } catch (e) { console.log("There was an issue converting the incoming data to utf-8", e) }
      this.setCommand("");
      this.mainLoop();
    })
    this.socket.on("close", () => {
      console.log("\n");
      console.log("CONNECTION ENDED");
      this.setCommand("");
      this.setPort(0);
      this.socket = new Socket();
      this.setSocketListeners();
      this.mainLoop();
    })
    this.socket.on("end", () => {
      console.log("THANK YOU FOR USING THE SNAZZY SERVER. COME BACK SOME TIME");
      this.socket.destroy();
      process.exit();
    })
  }
}

// MAIN APPLICATION RUN HERE
//--------------------------
const client = new Client();
client.mainLoop();
//--------------------------

