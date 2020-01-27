from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread

class Handler(BaseHTTPRequestHandler):
    hooks = {}
    def _set_headers(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path in self.hooks:
            func, args, kwargs = self.hooks[self.path]
            func(*args, **kwargs)
        self._set_headers()

    def bind(path, hook, *args, **kwargs):
        Handler.hooks[path] = [hook, args, kwargs]

class Listener(Thread):
    def __init__(self, addr='localhost', port=8000):
        self.addr = addr
        self.port = port
        Thread.__init__(self, daemon=True)

    def bind(self, *args, **kwargs):
        Handler.bind(*args, **kwargs)

    def run(self):
        print('Listen on {}: {}'.format(self.addr, self.port))
        server_address = (self.addr, self.port)
        httpd = HTTPServer(server_address, Handler)
        httpd.serve_forever()
