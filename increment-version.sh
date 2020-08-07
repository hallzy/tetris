#!/bin/bash
sed -i -r 's@(.*)(\?v=)([0-9]+)(.*)@echo "\1\2$((\3+1))\4"@ge' index.html
