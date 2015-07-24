#!/bin/sh

exe_dir=$(cd "$(dirname "$0")"; pwd)
wms_source_path=$exe_dir
tool="svn"
checkout_cmd="checkout"
path="svn://172.22.1.71/sw/uranus/feature/ezCloud"
revision=""

#if [ $wms_source_path = "/opt/wms" ];then
#	echo "please execute in /opt/wms directory"
#	exit 1
#fi
if [ -n "$1" ]
then
	revision=$1
fi
if [ ! -n "$tool" ] || [ ! -n "$checkout_cmd" ] || [ ! -n "$path" ]
then
	echo "download wms source code failed!"
	exit 1
else
	rm -rf $wms_source_path/ezCloud
	if [ $? -eq 0 ];then
		echo "rm -rf $wms_source_path/ezCloud"
	else
		exit 1
	fi
	
	if [ ! -n "$revision" ]
	then
		checkout_opt=""
	else
		checkout_opt=" -r $revision"
	fi
	
	$tool $checkout_cmd $checkout_opt $path
	if [ $? -eq 0 ];then
		echo "$tool $checkout_cmd $checkout_opt $path"
		cd $wms_source_path/ezCloud
		chmod 777 ./*
		cp $wms_source_path/ezCloud/release.sh $wms_source_path/
	else
		echo "download wms source code failed!"
		exit 1
	fi
fi
