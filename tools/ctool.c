#include "ctool.h"

UINT32* crc_GenTable32(void)
{
    static BOOL   inited = FALSE;
    static UINT32 crctable[256];

    if (inited)
    {
        return crctable;
    }

    inited = TRUE;
         
    {
        register UINT32 i;
        register UINT32 j;
        UINT32          accum = 0;
        UINT32          poly = 0;
        INT32           pn32[] =
                        {
                        //  x32 + x26 + x23 + x22 + x16 + x12 + x11 + x10 + x8 + x7 + x5 + x4 + x2 + x + 1       
                            0, 1, 2, 4, 5, 7, 8, 10, 11, 12, 16, 22, 23, 26 
                        };

        for (i = 0; i < VOS_NELEM(pn32); i++)
        {
           poly = poly | (1UL<<pn32[i]);
        }

        for (i = 0; i < 256; i++) 
        {
           accum = i << 24;
           for (j = 0; j < 8; j++) 
           {
               if (accum & (1L << 31))
               {
                   accum = (accum << 1) ^ poly;
               }
               else
               {
                   accum = accum << 1;
               }
           }
           crctable[i] = accum;
        }
    }

    return crctable;
}

/*
 * calculate CRC on the data block one byte at a time
 */
UINT32 crc_Calculate32(UINT32 accum, const UINT8* pBuf, UINT32 size)
{
    UINT32       i;
    const UINT8* ptr = pBuf;
    UINT32*      table = crc_GenTable32();

    
    accum = ~accum;
    for (i = 0; i < size; i++)
    {
        accum =  table[((accum >> 24) ^ ptr[i]) & 0xff] ^ (accum << 8);
    }
    return ~accum;
}

UINT32 CRC_CalculateFile32(UINT32 media, RW_FUNC readFunc, UINT32 offset, UINT32 length)
{
    UINT8 buff[256];
    UINT32 accum = 0;
    UINT32 readBytes = 0;
    UINT32 ndone = 0;


    for (ndone = 0; ndone < length;)
    {
        readBytes = (*readFunc)(media, offset + ndone, buff, ((length - ndone) < 256) ? (length - ndone) : 256);
        if (readBytes <= 0)
        {
		    printf("go here!");
            return accum;
        }
        
        accum = crc_Calculate32(accum, buff, readBytes);
        
        ndone += readBytes;

        if (ndone >= length)
        {
            break;
        }
    }

    return accum;
}

UINT32 CRC_Calculate32(const UINT8* sequence, UINT32 length)
{
    return crc_Calculate32(0, sequence, length);
}

UINT32 FD_BlockRead(UINT32 fd, UINT32 offset, UINT8* pBuf, UINT32 size)
{
    INT32 bytes;

    if (-1 == lseek(fd, offset, SEEK_SET))
    {
        return 0;
    }

    bytes = read(fd, pBuf, size);
    if (-1 == bytes)
    {
        return 0;
    }

    return bytes;
}

/*encrypt system configuration file*/
BOOL Encrypt_config_file(char filename[64])
{
    FILE    *fp;
    struct stat stats;
    char *buf;
    struct  cig_file_header *header;
    int i, hlen, flen, tlen;

    memset(&stats, 0, sizeof(stats));
    if(filename == NULL || strlen(filename) == 0)
    {
        printf("file name is null!\n");
        return FALSE;
    }
    printf("file name is %s!\n", filename);
    if (stat(filename, &stats) != 0)
    {
        printf("get file '%s' stats failed!\n", filename);
        return FALSE;
    }

    if (stats.st_size > 0)
    {
        fp = fopen(filename, "r");
        if (!fp)
        {
            printf("open file '%s' failed!\n", filename);
            return FALSE;
        }

        flen = stats.st_size;
        hlen = sizeof(struct cig_file_header);
        tlen = flen + hlen;

        // read original config file
        buf = (char *)calloc(1, tlen);
        if (!buf)
        {
            printf("calloc buffer failed!\n");
            fclose(fp);
            return FALSE;
        }
        fread(buf, flen, 1, fp);
        fclose(fp);

        // encrypt config file: XOR with CIG_FILE_ENC_CHAR(0xbb)
        for (i = 0; i < stats.st_size; i++) {
            buf[i] ^= CIG_FILE_ENC_CHAR;
        }

        // add file header
        header = (struct cig_file_header *)(buf+flen);
        header->magic = CIG_FILE_MAGIC;
        header->type = CIG_FILE_TYPE_CFG;
        header->length = stats.st_size;
        header->crc32 = CRC_Calculate32((UINT8 *)buf, (UINT32)flen);

        fp = fopen(TMP_EXPORT_ENC_CFG_FILENMAE, "w");
        if (!fp)
        {
            free(buf);
            return FALSE;
        }
        fwrite(buf, tlen, 1, fp);
        fclose(fp);
        free(buf);
        printf("ctool: encrypt file '%s' successful!\n", filename);
        return TRUE;
    }

    return FALSE;
}

/*unencrypt system configuration file*/
int Unencrypt_config_file(char *filename)
{
    FILE    *fp;
    struct  stat fs;
    struct  cig_file_header *header;
    int     i, flen, hlen, tlen;
    char    *buf, cmd[128];

    memset(&fs, 0, sizeof(fs));
    if(filename == NULL || strlen(filename) == 0)
    {
        printf("file name is null!\n");
        return -1;
    }
    if (0 != stat(filename, &fs))
    {
        printf("get file '%s' stats failed!\n", filename);
        return -1;
    }

    tlen = fs.st_size;
    hlen = sizeof(struct cig_file_header);
    flen = tlen - hlen;
    if (flen < CIG_FILE_CFG_MIN_LEN)
    {
        printf("file length %d < 1024!\n", flen);
        return 0;
    }

    fp = fopen(filename, "r");
    if (!fp)
    {
        printf("open file '%s' failed!\n", filename);
        return -1;
    }

    buf = (char *)calloc(1, tlen);
    fread(buf, tlen, 1, fp);
    fclose(fp);

    header = (struct cig_file_header *)(buf+flen);
    // check magic and type
    if (header->magic != CIG_FILE_MAGIC || header->type != CIG_FILE_TYPE_CFG)
    {
        free(buf);
        printf("cfg file is invalid!\n");
        return 0;
    }

    // check length
    if (header->length != flen)
    {
        free(buf);
        printf("cfg file length is error!\n");
        return 0;
    }

    // check crc32
    if (header->crc32 != CRC_Calculate32((UINT8 *)buf, (UINT32)flen))
    {
        free(buf);
        printf("cfg file crc is error!\n");
        return 0;
    }

    // unencrypt, XOR with CIG_FILE_ENC_CHAR(0xaa)
    for (i = 0; i < flen; i++)
    {
        buf[i] ^= CIG_FILE_ENC_CHAR;
    }

    // write config file to tmp
    fp = fopen(TMP_IMPORT_UNENC_CFG_FILENAME, "w");
    if (!fp)
    {
        free(buf);
        printf("open file '%s' failed!\n", TMP_IMPORT_UNENC_CFG_FILENAME);
        return -1;
    }
    fwrite(buf, flen, 1, fp);
    fclose(fp);
    free(buf);
    sprintf(cmd, "mv %s %s", TMP_IMPORT_UNENC_CFG_FILENAME, IMPORT_UNENC_CFG_FILENAME);
    system(cmd);
    printf("ctool: unencrypt file '%s' successful!\n", filename);
    return 1;
}

int CheckFileImage(char *filename_p, int length)
{
    INT32           fd, filemagic, ret;
    INT32           base_cramfs_size;
    UINT32          crc = 0, oricrc = 0;
    struct stat file_stat;
    char filename[100];

    memset(filename, 0, 100);
    if(filename == NULL || length == 0)
    {
        printf("file name is null!\n");
        return -1;
    }
    strncpy(filename, filename_p, length);

    if((fd = open(filename, O_RDONLY)) < 0)
    {
         printf("in %s : open %s failed\n",__func__,filename);
         return -1;
    }

    memset(&file_stat,0,sizeof(file_stat));
    if(fstat(fd,&file_stat))
    {
         printf("in %s : fstat failed\n",__func__);
         close(fd); 
         return -1;
    }
    
    if (-1 == lseek(fd, 0, SEEK_SET))
    {
        printf("in %s : lseek failed\n",__func__);
        close(fd); 
        return -1;
    }

    if(read(fd, (INT8*)(&filemagic), 4) != 4)
    {
        printf("read filemagic failed \r\n");
        close(fd); 
        return 0;
    }

    if((filemagic != 0x28cd3d45) && (filemagic != 0x453dcd28))
    {
        printf("filemagic error! \r\n");
        close(fd); 
        return 0;     
    }

    //get cramfs size
    if (-1 == lseek(fd, 4, SEEK_SET))
    {   
        printf("in %s : get size lseek failed\n",__func__);
        close(fd);
        return -1;
    }

    ret = read(fd, (INT8*)(&base_cramfs_size), 4);
    if(ret != 4)
    {
        printf("in %s : get size read failed\n",__func__);
        close(fd);
        return -1;
    }
    
    base_cramfs_size = htonl(base_cramfs_size);
    if(file_stat.st_size != base_cramfs_size+4)
    {
        printf("in %s : image size check failed\n",__func__);
        close(fd);
        return -1;
    }

    crc = CRC_CalculateFile32(fd, FD_BlockRead, 0, base_cramfs_size);
    if(-1 == lseek(fd, base_cramfs_size, SEEK_SET))
    {   
        printf("in %s : get crc lseek failed\n",__func__);
        close(fd);
        return -1;
    }
    ret = read(fd, (INT8*)(&oricrc), 4);
    if(ret != 4)
    {   
        printf("in %s : get crc read failed\n",__func__);
        close(fd); 
        return -1;
    }

    oricrc= htonl(oricrc);
    printf("in %s : calc_crc=0x%08x img_crc=0x%08x\n",__func__,crc,oricrc);
    if(crc != oricrc)
    {
        printf("check file crc error!\n");
        ret = -1;
    }
    else
    {
        printf("check file crc correct!\n");
        ret = 1;
    }
    close(fd);

    return ret;
} 

int CheckImgSWVersion(char *filename_p, int length, char *swver)
{
    INT32    fd, ret;
    char    org_swver[12]={0};
    char filename[100];

    memset(filename, 0, 100);
    if(filename == NULL || length == 0)
    {
        printf("file name is null!\n");
        return -1;
    }
    strncpy(filename, filename_p, length);

    if(swver == NULL || strlen(swver) == 0)
    {
        printf("sw version is NULL!\n");
        return -1;
    }

    if((fd = open(filename, O_RDONLY)) < 0)
    {
         printf("%s : open %s failed\n",__func__,filename);
         return -1;
    }

    if (-1 == lseek(fd, CIG_SWVER_INFO_OFFSET, SEEK_SET))
    {
        printf("%s : lseek failed\n",__func__);
        close(fd); 
        return -1;
    }

    ret = read(fd, org_swver, CIG_SWVER_INFO_SIZE);
    if(ret != CIG_SWVER_INFO_SIZE)
    {   
        printf("%s : get sw version failed\n",__func__);
        close(fd); 
        return -1;
    }

    printf("%s : swver=%s org_swver=%s\n",__func__,swver,org_swver);
    if(strncmp(org_swver, swver, CIG_SWVER_INFO_SIZE) == 0)
    {
        printf("check image sw version success!\n");
    }
    else
    {
        printf("check image sw version failed!\n");
        close(fd);
        return -1;
    }
    
    close(fd);
    return 1;
}

#if 0
int main(int argc, char **argv)
{
    if(argc != 3 && argc != 4) 
    {
       printf("Usage: ctool [encrypt/unencrypt] [config file]\n             [checkimg/checkver] [image file] [version]\n");
       return -1;
    }

    if(strncmp(argv[1], "encrypt", 7) == 0)
    {
       Encrypt_config_file(argv[2]);
    }
    else if(strncmp(argv[1], "unencrypt", 9) ==0)
    {
       Unencrypt_config_file(argv[2]);
    }
    else if(strncmp(argv[1], "checkimg", 8) ==0)
    {
       CheckFileImage(argv[2]);
    }
    else if(strncmp(argv[1], "checkver", 8) ==0)
    {
       CheckImgSWVersion(argv[2], argv[3]);
    }
    else
    {
       printf("Usage: ctool [encrypt/unencrypt] [config file]\n             [checkimg/checkver] [image file] [version]\n");
       return -1;
    }
          
    return 1;
}
#endif

