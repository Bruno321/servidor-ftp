const { Socket } = require('net');
const readline = require("readline");
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// External Handlers
const handleEnterCommand = () => {
  rl.question("Enter A Command [OPEN, GET, PUT, CLOSE, QUIT]: ", (command) => {
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
  handleClose() {
    console.log("CLOSING");
    this.socket.destroy();
  }
  quitClient() {
    this.socket.end();
  }


  mainLoop() {
    // STATE CONTROLLER
    if (this.command !== "") {
      switch (this.command.toLowerCase()) {
        case ("open"): { this.handleOpen(); break; }
        case ("get"): { this.handleGet(); break; }
        case ("put"): { this.handlePut(); break; }
        case ("close"): { this.handleClose(); break; }
        case ("quit"): { this.quitClient(); break; }
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
    this.socket.on("data", (data) => {
      try {
        const response = data.toString('utf-8');
        // GET RESPONSE
        if (response.includes(":")) {
          try {
            const args = `${data}`.split(":");
            fs.writeFileSync(args[0], args[1]);
            console.log(`Successfully recieved and saved file: ${args[0]}`);
          } catch (e) { console.log("Could not write the incoming file to local file system.") }
        } else {
          // PUT RESPONSE
          console.log(data.toString('utf-8'));
        }
      } catch (e) { console.log("There was an issue converting the incoming data to utf-8") }
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

