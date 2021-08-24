+++
title = "xml-attribute-diff"
description = ""
weight = 10

[taxonomies]
tags = ["rust", "cli", "xml"]

[extra]
project = true
repo = "https://github.com/KaiWitt/xml-attribute-diff"
crates = ""
link = ""
+++

Compares all unique attribute values of two xml files. Written to compare strings.xml translation files in Android projects.


<!-- more -->
<br>

#### Description
Hierarchy aswell as tag names and texts are ignored, only the values of attributes will be compared.


#### Usage
```
xml-attribute-diff 0.1.0
Compare unique attribute values of two xml files

USAGE:
    xml-attribute-diff.exe <file1> <file2>

FLAGS:
    -h, --help       Prints help information
    -V, --version    Prints version information

ARGS:
    <file1>    Original xml file, used as a reference for the comparison
    <file2>    xml file to compare to the original file
```


#### Example
```
$xml-attribute-diff abc.xml xyz.xml
file2 has one attribute value more than file1
file2 has 3 new attribute values:
        blue
        red
        purple
file2 has 2 missing attribute values:
        white
        black
```
