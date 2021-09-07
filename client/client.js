const { Socket } = require('net');
const readline = require("readline");
const fs = require('fs');
const path = require('path');
// TODO : cambiar todos los write a algo menos naco tambien
var server_path = ''

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// External Handlers
const handleEnterCommand = () => {
  rl.question("Enter A Command [OPEN, GET, PUT, CLOSE, QUIT, PWD, LS, CD, DELETE, RMDIR, LCD]: ", (command) => {
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
  name = ''
  extension = ''
  fileIsAboutToBeRecieved = false
  packets = 0;
  buffer = new Buffer(0);
  default_lcd_dir = process.cwd().toString() + '\\lcd'
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

  recibirArchivo(data){
    this.packets++;
    console.log(data);
    this.buffer = Buffer.concat([this.buffer, data]);
  }

  writeData(){
    console.log("total packages", this.packets);

    var writeStream = fs.createWriteStream(`${this.default_lcd_dir}\\${this.name}.${this.extension}`,{emitClose:true});
    console.log("buffer size", this.buffer.length);
    while(this.buffer.length){
      var head = this.buffer.slice(0, 4);
      console.log("head", head.toString());
      if(head.toString() != "FILE"){
        // no siempre puede significar error
        console.log("ERROR!!!!");
        process.exit(1);
      }
      
      var sizeHex = this.buffer.slice(4, 8);
      var size = parseInt(sizeHex, 16);

      console.log("size", size);

      var content = this.buffer.slice(8, size + 8);
      var delimiter = this.buffer.slice(size + 8, size + 9);
      console.log("delimiter", delimiter.toString());
      if(delimiter != "@"){
        console.log("wrong delimiter!!!");
        process.exit(1);
      }

      writeStream.write(content);
      this.buffer = this.buffer.slice(size + 9);
    }

    setTimeout(function(){
      writeStream.end();
    }, 2000);

    writeStream.on('close',()=>{
      console.log('File saved correctly')
      this.fileIsAboutToBeRecieved = false
      console.log('Restarting connection...')
      // reinicar conexion?  
      this.socket.connect(3000, "127.0.0.1");
      this.socket.write('pito')
    })
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
      // util para lcd
      // this.setCommand("");
      // this.mainLoop();
      var extensions_allowed = ['txt','jpg','png','pdf']
      // si el nombre del archivo lleva puntos ya valio VERGA
      var splited_fileName = value.split('.')
      this.name = splited_fileName[0]
      this.extension = splited_fileName[1]
      if (extensions_allowed.includes(this.extension)) {
        this.socket.write(`GET,${value}`);
      } else {
        console.log("You have entered an invalid file type. Files must be txt, jpg,png or pdf");
        this.setCommand("");
        this.mainLoop();
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
          this.socket.write(`PUT,${value},${data}`);
        }
        const handleError = () => {
          this.setCommand("");
          this.mainLoop();
        }
        fs.readFile(this.default_lcd_dir + "\\" + value, 'utf8', function (err, data) {
          try {
            if (err) throw err;
            transmit(data);
          } catch (e) {
            console.log(`Error reading file: ${value} (maybe is not on LCD directory)`);
            handleError()
          }
        });
      }
    });
  }
  
  // LCD
  handleLcd(){
    // all GET files will be downloaded on this path, and files to upload will be here
    rl.question("Enter the full path of the dir: [Ej: D:\\sistemas-dis\\FTP-Client-and-Server\\client\\lcd]: " ,(value)=>{
      this.default_lcd_dir = value
      this.socket.write(`LCD,${value}`)
    })
  }

  // CD
  handleCd(){
    rl.question("Enter the directory name in which you want to move: ", (value)=>{
      this.socket.write(`CD,${value},${server_path}`)
    })
  }

  // LS
  handleLs(){
    this.socket.write("LS")
  }

  // DELETE
  handleDelte(){
    rl.question("Enter the name of the file you want to delete [-R to delete a entire directory Ej: -R folder_to_delete]: ", (value)=>{
      if(value.charAt(0) == '-'){
        let folderToDelete = value.split(" ")
        this.socket.write(`DELETE,${folderToDelete}`)
      } else {
        this.socket.write(`DELETE,${value}`)
      }
    })
  }

  // MPUT
  handleMput(){
    rl.question("Enter the name of the files separated by a comma: ", (value)=>{

    })
  }

  // MGET
  handleMget(){
    rl.question("Enter the name of the files separated by a comma: ", (value)=>{
      
    })
  }

  // RMDIR
  handleRmdir(){
    rl.question("Enter the name of the dir you want to delete [only empty dirs will be deleted]: ", (value)=>{
      this.socket.write(`RMDIR,${value}`)
    })
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
        this.socket.write('initial_state')
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
      // console.log(data)
      // client is going to send a file MISSING
      // server is going to send a file
      if(this.fileIsAboutToBeRecieved){
        // recibe file
        console.log('Recibing file...')
        this.recibirArchivo(data)
      } else {
        // normal communication
        const raw_response = data.toString('utf-8');
        const response = JSON.parse(raw_response)
        
        if (response.type == 'file_incoming') {
          this.fileIsAboutToBeRecieved = true
          this.socket.write('r')
          console.log('Sign send, a file is about to being recieved, fileIsAboutToBeRecieved set to: ' ,this.fileIsAboutToBeRecieved.toString())
        } else if(response.type == 'get'){
          console.log(response.data)
        }else if(response.type == 'put'){
          // PUT RESPONSE
          console.log(response.data);
        }  else if (response.type == 'lcd'){
          // LCD RESPONSE
          console.log(this.default_lcd_dir)
        } else if (response.type == 'cd'){
          // CD RESPONSE
          console.log(response.data)
        } else if (response.type == 'delete'){
          // DELETE RESPONSE
          console.log(response.data)
        } else if (response.type == 'mput'){
          // MPUT RESPONSE
        }  else if (response.type == 'mget'){
          // MGET RESPONSE
        } else if (response.type == 'rmdir'){
          // RMDIR RESPONSE
          console.log(response.data)
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
        } else if (response.type == 'initial_state'){
          server_path = response.data
        }
      }

      this.setCommand("");
      this.mainLoop();
    })
    //   try {
    //     const raw_response = data.toString('utf-8');
    //     const response = JSON.parse(raw_response)
    //     // GET RESPONSE

    //   } catch (e) { console.log("There was an issue converting the incoming data to utf-8", e) }
    //   this.setCommand("");
    //   this.mainLoop();
    // })
    this.socket.on("close", () => {

      // fake closing
      if(this.fileIsAboutToBeRecieved){
        this.writeData()
      } else {
        // true closing
        console.log("\n");
        console.log("CONNECTION ENDED");
        this.setCommand("");
        this.setPort(0);
        this.socket = new Socket();
        this.setSocketListeners();
        this.mainLoop();
      }

    })
    
  }
}

// MAIN APPLICATION RUN HERE
//--------------------------
const client = new Client();
client.mainLoop();
//--------------------------

