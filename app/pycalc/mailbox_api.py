from __future__ import print_function
from calc import calc as real_calc
from proto_v2 import proc as real_proc
import sys
import zerorpc

class MailApi(object):
    def proc(self,filename):
        """based on proto_v2 proc - or origninally as main"""
        try:
            return real_proc(filename)
        except Exception as e:
            return 0.0    
    def echo(self, text):
        """echo any text"""
        return text

def parse_port():
    port = 4242
    try:
        port = int(sys.argv[1])
    except Exception as e:
        pass
    return '{}'.format(port)

def main():
    addr = 'tcp://127.0.0.1:' + parse_port()
    s = zerorpc.Server(MailApi(),timeout=None,heartbeat=None)
    s.bind(addr)
    print('start running on {}'.format(addr))
    s.run()

if __name__ == '__main__':
    main()
