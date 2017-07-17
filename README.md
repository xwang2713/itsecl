# ITSECL

This project is still in protype stage which reference the implementation of [ITypecript](https://github.com/nearbydelta/itypescript)

ITSECL is a Typescript/ECL kernel for the [Jupyter notebook](http://jupyter.org/)...

## Installations
```sh
npm config set prefix <install directory>
# make sure <install directory>/bin is in PATH
git clone https://github.com/xwang2713/itsecl
cd ijsecl
npm install -g .
<install directory>/bin/itsecl --install=local
There is warning "Invalid flag for install location local" but installation is OK
# To verify ITSECL kernel (jsecl) installed in jupyter:
jupyter kernelspec list
```
To run ITSECL in jupyter consoel
```sh
jupyter console --kernel=tsecl
```
To run ITSECL in jupyter notebook
```sh
jupyter notebook
# Then select kernel "tsecl" from "new"
```

## Usage

### Run normal Javascript/Typescript code:
```sh
//JS
var i = 10; i;
```

### Test connection with HPCC esp server
***This is still under development***

In order to run ECL code you should test connection with HPCC ESP server first 
```sh
//CONN  ip=192.168.56.100; port=8010; cluster=hthor; user=<username>; password=<password>;
```
The above connection parameters can be provided from a file
```sh
//CONN  file=/tmp/esp.cfg;
```
The file should can have following entries:
```sh
ip=190.29.2.11
port=8018
cluster=thor
user=hpccuser
passwd=mypassword
default=ECL
```

### Test connection with HPCC esp server
***This is still under development***

ECL code
```sh
//ECL
OUTPUT("Hello ECL");
```
If default action is set to "ECL", which is default, "//ECL" can be avoid"





