"""Fail closed for local tests and development; production uses injected env only."""
import os
import socket
from urllib.parse import urlsplit


def assert_local_database_environment():
    for name in ("DATABASE_URL", "SUPABASE_URL", "REDIS_URL"):
        value = os.environ.get(name, "")
        if not value or value == ":memory:" or value.startswith("sqlite:"):
            continue
        try:
            host = urlsplit(value).hostname
        except ValueError:
            host = None
        if host not in {"localhost", "127.0.0.1", "::1"}:
            raise RuntimeError(f"WARNING: {name} is non-local; tests could modify remote data. Aborting.")


def install_local_network_guard():
    assert_local_database_environment()
    if getattr(socket.socket.connect, "_portfolio_local_guard", False):
        return
    connect = socket.socket.connect
    connect_ex = socket.socket.connect_ex
    getaddrinfo = socket.getaddrinfo

    def check(address):
        if isinstance(address, tuple) and address[0] not in {"localhost", "127.0.0.1", "::1"}:
            raise OSError("WARNING: local execution blocked an external network connection.")

    def guarded_connect(sock, address):
        check(address)
        return connect(sock, address)

    def guarded_connect_ex(sock, address):
        check(address)
        return connect_ex(sock, address)

    def guarded_getaddrinfo(host, *args, **kwargs):
        if host not in {None, "localhost", "127.0.0.1", "::1", b"localhost", b"127.0.0.1", b"::1"}:
            raise OSError("WARNING: local execution blocked external DNS resolution.")
        return getaddrinfo(host, *args, **kwargs)

    guarded_connect._portfolio_local_guard = True
    socket.socket.connect = guarded_connect
    socket.socket.connect_ex = guarded_connect_ex
    socket.getaddrinfo = guarded_getaddrinfo
