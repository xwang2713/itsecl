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


