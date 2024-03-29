import { Component, OnInit } from '@angular/core';
import { BluetoothLE } from '@ionic-native/bluetooth-le/ngx';
import { Platform } from '@ionic/angular';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-ble',
  templateUrl: './ble.page.html',
  styleUrls: ['./ble.page.scss'],
})
export class BLEPage implements OnInit {
  devices:any[]=[];
  conectado:string = "";
  constructor(public bluetoothle: BluetoothLE,
                     public plt: Platform,
                     private alertCtrl:AlertController) {
    this.plt.ready().then((readySource) => {

      console.log('Platform ready from', readySource);
   
      this.bluetoothle.initialize().subscribe(ble => {
        console.log('ble', ble.status) // logs 'enabled'
      });
   
     });
   }

  ngOnInit() {

  }

  onEncender(){
    this.bluetoothle.enable();
    this.bluetoothle.hasPermission().then(
      b=>{
        console.log(JSON.stringify(b.hasPermission))

      }
    );
    //console.log(JSON.stringify(a))
    this.bluetoothle.requestPermission().then(
      b=>{
        console.log(JSON.stringify(b.requestPermission))

      }
    );
    this.bluetoothle.requestLocation().then(
      b=>{
        console.log(JSON.stringify(b.requestLocation))

      }
    )
  }

  onScan(){
    this.devices=[];
    this.conectado="";
    this.bluetoothle.startScan({services:[]}).subscribe(
      device => {
        if (device.status === "scanStarted") {

          console.log("Scanning for devices (will continue to scan until you select a device)...", "status");
      }
        if(device.status === "scanResult")
        {
          if (!this.devices.some(dispo=>{

            return dispo.address === device.address;

        })) {

            console.log('FOUND DEVICE:');
            console.log(JSON.stringify(device));
            this.devices.push(device)
        }

         
          
          
         }
        else{
          console.log(JSON.stringify("No se escanea nada"))
        }
      }, 
     
      error =>  {
        console.log("Uh oh: " + JSON.stringify(error))
      })
    setTimeout(() => {
      this.bluetoothle.stopScan();
    }, 10000);

  }

  onGetAdapterInfo(){
    this.bluetoothle.getAdapterInfo().then(
      ble=>{
        console.log(`Estado activado:${ble.isEnabled}
        Nombre display adapter:${ble.name}, 
        Direccion del adapter:${ble.address}, 
        Estado de escaneo:${ble.isScanning}, 
        Es visible:${ble.isDiscoverable}`)
      }
    )
  }

  async presentAlert() {
    const alert = await this.alertCtrl.create({
      cssClass: 'my-custom-class',
      header: 'Alerta',
      subHeader: 'No se puede realizar la conexión',
      message: 'Parece que no hay dispositivos cercanos o tu dispositivo no es visible',
      buttons: ['OK']
    });

    await alert.present();

}

  verDispositivos(){
    console.log(JSON.stringify(this.devices))
  }
  apagar(){
    this.bluetoothle.disable();
  }
  vincular(direccion:any){
    this.bluetoothle.bond(direccion).subscribe(
        resultado=>{
          if (resultado.status) {
            console.log(resultado.status),
            console.log("vinculado!!!")
          }

          else{
            console.log("desvinculado")
          }
        },
        error=>{
          console.log("paila")
        }

    );

  }
  conectar(direccion:any){
    console.log("ESTA CONECTANDOOOOOOOO")
    console.log('Connecting to device: ' + direccion + "...", "status");

    this.bluetoothle.connect({ address: direccion }).subscribe(result=>{
      console.log("- " + JSON.stringify(result));

    if (result.status === "connected") {
        this.conectado="se conecto"
        console.log("conectado")
        this.descubrir(direccion)
    }
    else if (result.status === "disconnected") {
        this.conectado="desconectado"
        console.log("Disconnected from device: " + result.address, "status");
      }
    }
      
    , error=>{

      console.log("error en connect: ",JSON.stringify(error));
      this.bluetoothle.close({address:direccion}).then(
        exito=>{
          console.log("exito: ",JSON.stringify(exito.status))
        },
        error=>{
          console.log("error: ",JSON.stringify(error.error))
        }
      )
    });
  
  }
  connectSuccess(result) {

    console.log("- " + result.status);

    if (result.status === "connected") {

        console.log("conectado")
    }
    else if (result.status === "disconnected") {

        console.log("Disconnected from device: " + result.address, "status");
    }
}

  descubrir(direccion:any){
  this.bluetoothle.discover({
    address: direccion,
    clearCache: true
  }).then(resultado=>{
    if (resultado.status==="discovered") {
      console.log(JSON.stringify(resultado.address),JSON.stringify(resultado.services))
      this.leerHR(direccion)
      this.leerDescriptor(direccion)
      this.suscribirHR(direccion)
    }
    else{
      console.log("nada papapapa")
    }
  })
}

  leerHR(direccion:any,){
    this.bluetoothle.read({
      "address": direccion,
      "service": "1800",
      "characteristic": "2A00"
    }).then(resultado=>{
      console.log("LEYENDO SERVICIO")
      this.conversion(resultado.value)
    },
    error=>{
      console.log("EDAAAAAAAA",JSON.stringify(error))
    }
    )
  }
  leerDescriptor(direccion:any){
    this.bluetoothle.readDescriptor({
      "address": direccion,
      "service": "FEE0",
      "characteristic": "2A2B",
      "descriptor": "2902"
    }).then(resultado=>{
      console.log("LEYENDO DESCRIPTOR")
      this.conversion(resultado.value)
    },
    error=>{
      console.log("EERROR DESCRIPTOR",JSON.stringify(error))
    }
    )
  }
  suscribirHR(direccion:any){
    this.bluetoothle.subscribe(
      {
      "address": direccion,
      "service": "180D",
      "characteristic": "2A37",
    }).subscribe(
      resultado=>{
        if(resultado.status==="subscribed"){
          console.log("SE SUSCRIBIO")
          console.log(JSON.stringify(resultado))
        }
        else if(resultado.status==="subscribedResult"){
          console.log("entra a suscribresult")
        }
        else{
          console.log("nada da ")
          console.log(JSON.stringify(resultado))
        }
        console.log("resultado por fuera",JSON.stringify(resultado))
      },error=>{
        console.log("ERROR EN SUSCRIPCIÓN",JSON.stringify(error))
      }
    );setTimeout(() => {
      this.bluetoothle.unsubscribe(
        {
          "address": direccion,
          "service": "180D",
          "characteristic": "2A37",
        }
      ).then(
        result=>{
          console.log("SE DESUSCRIBIO")
        }
      )
    }, 20000);;
  }
  conversion(valor){
    var bytes = this.bluetoothle.encodedStringToBytes(valor);
    var string = this.bluetoothle.bytesToString(bytes);
    console.log(JSON.stringify(string))
  }
  
}

 //console.log(JSON.stringify(device),JSON.stringify(typeof(device)),"yyayayay")
        //   if (this.devices.length===0) {
        //     this.devices.push(device);
        //     console.log("arreglo vacio, agrego elemento")
        //   }else{
        //     this.devices.forEach(b=>{
        //       if (Object.values(b).includes(device.address)) {
        //         // let indice=this.devices.indexOf(b)
        //         // this.devices.splice(indice, 1);
                
        //         console.log("paso y no guardo");
        //         return;
        //      }
        //     else if(Object.values(b).includes(device.address)!){
        //       this.devices.push(device)
        //       console.log("agrego un nuevo dispositivo",JSON.stringify(device.address))
        //     }
        //     else{
        //       this.devices.push(device)
        //       //console.log("algo anda raro")
        //     }
        //     })
        //   }
          



 // device => {
      //   if(device.status == "scanResult" || device.status == "scanStarted")
      //   {
      //     console.log(JSON.stringify(device.status))
      //     if (device.status == "scanResult") {
      //       this.devices.push(device)
      //       console.log(JSON.stringify(device))
      //     }
      //     else{
      //       this.presentAlert()
      //     }
      //   }
      // }, 