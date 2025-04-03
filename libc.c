#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>
#include <stdint.h>

int main() {
    // Đường dẫn đến thư viện libc
    const char *libc_path = "/lib/x86_64-linux-gnu/libc.so.6";

    // Mở thư viện libc
    void *libc_handle = dlopen(libc_path, RTLD_LAZY);
    if (!libc_handle) {
        fprintf(stderr, "dlopen failed: %s\n", dlerror());
        return 1;
    }

    // Tìm địa chỉ của __libc_start_main
    void (*__libc_start_main_ptr)(void);
    __libc_start_main_ptr = (void (*)(void))dlsym(libc_handle, "__libc_start_main");
    if (!__libc_start_main_ptr) {
        fprintf(stderr, "dlsym failed: %s\n", dlerror());
        dlclose(libc_handle);
        return 1;
    }

    // In ra địa chỉ của __libc_start_main
    printf("__libc_start_main address: %p\n", (void *)__libc_start_main_ptr);

    // Đóng thư viện
    dlclose(libc_handle);

    return 0;
}
