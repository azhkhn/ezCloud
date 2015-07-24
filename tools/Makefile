CTOOL_DIR = /op/wms/ezCloud/tools
CTOOL_OBJ_DIR   = ${CTOOL_DIR}/obj
ctool_SOURCES   = ${CTOOL_DIR}/ctool.c
CC = gcc
CFLAGS = -g -Wall 

  
ctool_LIB = libctool.so
ctool_BIN = ctool

VPATH += $(dir $(ctool_SOURCES))
ctool_OBJS = $(addprefix $(CTOOL_OBJ_DIR)/,$(addsuffix .o, $(basename $(notdir $(ctool_SOURCES)))))

default:all

all: prebuild $(ctool_LIB) posbuild

prebuild:
	mkdir -p ${CTOOL_OBJ_DIR}
	
posbuild:
	rm -rf $(CTOOL_OBJ_DIR)
	
${CTOOL_OBJ_DIR}/%.o: %.c
	$(CC) -c $(CFLAGS) -fPIC $< -o $@

$(ctool_LIB): $(ctool_OBJS)
	$(CC) -fPIC -shared $(ctool_OBJS) -o $@

$(ctool_BIN): $(ctool_OBJS)
	$(CC) $(ctool_OBJS) -o $@

clean:
	rm -rf $(CTOOL_OBJ_DIR)
	rm -rf $(ctool_LIB)

