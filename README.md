# ITSECL

ITSECL is a Typescript/ECL kernel for the [Jupyter notebook](http://jupyter.org/)...
It provide a prototype implementation of HPCC ECL for Jupyter Notebook by referencing [ITypeScript](https://github.com/nearbydelta/itypescript)

The HPCC Systems server platform is a free, open source, massively scalable platform for big data analytics. Download the HPCC Systems server platform now and take the reins of the same core technology that LexisNexis has used for over a decade to analyze massive data sets for its customers in industry, law enforcement, government, and science.

For more information and related downloads for HPCC Systems Products, please visit
https://hpccsystems.com


## Installations

Prerequites:
python-dev, python3.5-dev, python-pip python3-pip jupyter nodejs

For example on Ubuntu 16.04 xenial 
```sh
sudo apt-get install -y curl git python-dev python3.5-dev python3-pip
sudo pip3 install jupyter
sudo curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs

 
```
Install ITSECL
```sh
npm install -g itsecl
npm install -g request
npm install -g d3-time-format

```
To install itsecl kernel to Jupyter 
```sh
itsecl --ts-install=global

# If you want to see itsecl kernel debug message add "--ts-debug"
# To verify ITSECL kernel (jsecl) installed in jupyter:
jupyter kernelspec list. "tsecl" is the kernel name.
```
To run ITSECL in jupyter notebook in your Jupyter Notebook work directory which can be any directory. The Jupyter notebook files will be saved here.
```sh
jupyter notebook

# Or with debug information for tsecl kernel:

itsecl --ts-debug   
# Then select kernel "HPCC ECL - TSECL" from "new"
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



