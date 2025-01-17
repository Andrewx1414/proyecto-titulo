Pasos y consejos para el correcto funcionamiento de la aplicacion
1.- EL backend(endpoints) estan alojados en el archivo "server.js"
2.- cuando se descarguen los archivos del repositorio de github se deben
instalar las dependencias de nodejs en la carpeta del proyecto para que se genere la carpeta nodemodules,
3.- se debe hacer la instalacion de las dependencias de angularCLI en la carpeta para que pueda ejecutarse de forma correcta,
4.- la base de datos esta conectada a una base de datos de aws en rds, por lo que las consultas se hacen directamente en el servidor
5.- para que la base de datos funcione de forma correcta se debe modificar el archivo db.js en el cual se hace la conexion con la llave de
acceso que tambien esta dentro del repositorio con el nombre de "maackinesiologiatalca.pem", se debe cambiar la ruta del archivo para que
funcione de forma correcta y haga las consultas correspondientes
6.- teniendo todas las dependencias instaladas y la correccion del archivo .pem deberia funcionar de forma correcta

considerar para la ejecucion en visual studio code tener 2 terminales, un terminal para iniciar el backend con "node server.js" y un segundo
terminal para iniciar el frontend con ng serve.