# ITSECL

ITSECL is a Typescript/ECL kernel for the [Jupyter notebook](http://jupyter.org/)...
It provide a prototype implementation of HPCC ECL for Jupyter Notebook by referencing [ITypecript](https://github.com/nearbydelta/itypescript)

The HPCC Systems server platform is a free, open source, massively scalable platform for big data analytics. Download the HPCC Systems server platform now and take the reins of the same core technology that LexisNexis has used for over a decade to analyze massive data sets for its customers in industry, law enforcement, government, and science.

For more information and related downloads for HPCC Systems Products, please visit
https://hpccsystems.com


## Installations
npm install will come soon. For now use following:
```sh
npm config set prefix <install directory>
# make sure <install directory>/bin is in PATH
git clone https://github.com/xwang2713/itsecl
cd ijsecl
npm install -g .
```
To install itsecl to Jupyter and start Jupyter Notebook:
In your Jupyter Notebook work directory which can be any directory. The Jupyter notebook files will be saved here.
```sh
itsecl --install=local

# If you want to see itsecl kernel debug message add "--ts-debug"
# To verify ITSECL kernel (jsecl) installed in jupyter:
jupyter kernelspec list. "tsecl" is the kernel name.
```
To run ITSECL in jupyter notebook
```sh
jupyter notebook

# Or with debug information for tsecl kernel:

itsecl --ts-debug   
# Then select kernel "tsecl" from "new"
```
To run ITSECL in jupyter console (Currenly support for console is limit. Try to use notebook instead). 
```sh
jupyter console --kernel=tsecl
```

## Usage

### Run normal Javascript/Typescript code:
```sh
//JS
var i = 10; i;
```

### Test connection with HPCC esp server

In order to run ECL code you should test connection with HPCC ESP server first 
```sh
//CONN  ip=192.168.56.100; port=8010; cluster=hthor; user=<username>; password=<password>;
```
The above connection parameters can be provided from a file
```sh
//CONN  file=/tmp/esp.conf;
```
Sample esp.conf:
```sh
ip=190.29.2.11
port=8018
cluster=thor
user=hpccuser
passwd=mypassword
default=ECL
```

To display the current configuration:
```sh
//CONF
```

### Test connection with HPCC esp server
***This is still under development***

ECL code
```sh
//ECL
OUTPUT("Hello ECL");
```
If default action is set to "ECL", which is default, "//ECL" can be avoid"


To change cluster 
```sh
//ECL cluster=roxie;
...
```



