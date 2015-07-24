#ifndef CTOOL_H
#define CTOOL_H

#include <sys/types.h>
#include <stdio.h>
#include <sys/stat.h>
#include <unistd.h>
#include <sys/mman.h>
#include <fcntl.h>
#include <stdlib.h>
#include <errno.h>
#include <string.h>
#include <stdarg.h>
#include <stdint.h>
#include <libgen.h>
#include <ctype.h>
#include <time.h>
#include <getopt.h>
#include <linux/types.h>
#include <arpa/inet.h>

#define UINT32 unsigned int
#define INT32 int
#define UINT16 unsigned short
#define UINT8  unsigned char
#define INT8  char
#define BOOL int
#define FALSE 0
#define TRUE 1
#define ERROR -1
#define VOS_NELEM(array)   (sizeof(array)/sizeof(array[0]))

struct cig_file_header {
    unsigned int    magic;      // 'CIGG'
    unsigned int    length;     // file length, don't include file header
    unsigned int    crc32;      // don't include file header
    unsigned int    type;       // file type
    unsigned char   pad[16];    // future usage
};

typedef UINT32 (*RW_FUNC)(UINT32, UINT32,  UINT8*, UINT32);

#define CIG_FILE_MAGIC          0x43494747
#define CIG_FILE_TYPE_CFG       0x22222222
#define CIG_FILE_ENC_CHAR       0xbb
#define CIG_FILE_CFG_MIN_LEN    1024
#define TMP_IMPORT_UNENC_CFG_FILENAME    "/tmp/sys_config.import"
#define IMPORT_UNENC_CFG_FILENAME    "/tmp/upload/sys_config.sql"
#define TMP_EXPORT_ENC_CFG_FILENMAE            "/tmp/download/sys_config.encrypt"

#define CIG_SWVER_INFO_OFFSET          0x00000030
#define CIG_SWVER_INFO_SIZE            11

#endif /* CTOOL_H */