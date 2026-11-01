"""Synthetic keyboard observations of the isolated SS-2A test copy."""
from pathlib import Path
import subprocess,json,time
ROOT=Path(__file__).resolve().parent
HOST='superelevation-windows'
def run(args):
 return subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True).stdout
def command(name,keys):
 p=Path('/tmp/ss2-command.json');p.write_text(json.dumps({'name':name,'keys':keys}))
 run(['scp',str(p),f'{HOST}:SS2PilotTest/command.tmp'])
 run(['ssh',HOST,'mv SS2PilotTest/command.tmp SS2PilotTest/command.json'])
 for _ in range(80):
  out=run(['ssh',HOST,'cat SS2PilotTest/completed.txt']).strip()
  if out==name: break
  time.sleep(.25)
 else: raise RuntimeError('Timed out '+name)
 run(['scp',f'{HOST}:SS2PilotTest/{name}.png',str(ROOT/(name+'.png'))])
 print(name,flush=True)
if __name__=='__main__':
 command('legacy-project',['TEST{ENTER}','TEST{ENTER}','10000{ENTER}','L','5{ENTER}','4{ENTER}','4{ENTER}','N'])
 command('legacy-case1',['1{ENTER}','{ENTER}','{PAGEUP}'])
