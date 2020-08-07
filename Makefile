all:
	# Leading dash is to ignore errors
	-tsc --target ES3 *.ts
	# Increment the version number automatically
	bash increment-version.sh
