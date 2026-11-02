"""Characterize the isolated legacy Windows copy through its real keyboard UI."""
from pathlib import Path
import subprocess,json,time
ROOT=Path(__file__).resolve().parent
HOST='superelevation-windows'
def run(args):
 return subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True).stdout
def command(name,keys):
 p=Path('/tmp/ss3-command.json'); p.write_text(json.dumps({'name':name,'keys':keys}))
 run(['scp',str(p),f'{HOST}:SS3PilotTest/command.tmp'])
 run(['ssh',HOST,'mv SS3PilotTest/command.tmp SS3PilotTest/command.json'])
 script=f'for n in $(seq 1 80); do if test "$(cat SS3PilotTest/completed.txt 2>/dev/null | tr -d "\\r\\n")" = "{name}"; then powershell -NoProfile -ExecutionPolicy Bypass -File C:/Users/colew/SS3PilotTest/windows-read.ps1; exit; fi; sleep .2; done; exit 1'
 return json.loads(run(['ssh',HOST,script]).strip())
mins3=[3.5,4.084,4.667,5.25,5.834,6.417,7,7.583,8.167,8.75,3.125,3.583,4.042,4.468,4.943,5.417,5.833,6.333,7.25]
mins4=[3.125,3.4167,4,3]
cases=[]
for inlet,minimums in [('SS-3',mins3),('SS-4',mins4)]:
 for choice,minimum in enumerate(minimums,1):
  for variant,height in [('minimum',minimum),('raised',float(f'{minimum+1.2345:.4f}'))]:
   name=f'legacy-{inlet}-{choice}-{variant}'
   observed=command(name,[('1' if inlet=='SS-3' else '2')+'{ENTER}',f'{choice}00'+'{ENTER}',str(choice)+'{ENTER}',str(height)+'{ENTER}'])
   cases.append({'type':inlet,'choice':choice,'height':height,'typedHeight':str(height),'observed':observed})
   ROOT.joinpath('legacy-results.json').write_text(json.dumps({'cases':cases},indent=2)+'\n')
   print(name,observed['values']['concrete'],observed['values']['steel'],flush=True)
# The legacy report starts a new page every seven rows and clears result globals.
# Rerun those captures through the UI; never manufacture expected memory bytes.
page_break_captures=[]
for case in cases:
 if case['observed']['values']['concrete']!=0:continue
 page_break_captures.append(dict(case))
 for attempt in range(1,4):
  observed=command(f"legacy-retry-{case['type']}-{case['choice']}-{case['height']}-{attempt}",[
   ('1' if case['type']=='SS-3' else '2')+'{ENTER}',str(case['choice'])+'00{ENTER}',
   str(case['choice'])+'{ENTER}',case['typedHeight']+'{ENTER}'])
  if observed['values']['concrete']>0:
   case['observed']=observed;case['captureRetry']=attempt;break
 else:raise RuntimeError('No stable nonzero result capture after three tries')
assert len(cases)==46 and all(c['observed']['values']['concrete']>0 for c in cases)
ROOT.joinpath('legacy-results.json').write_text(json.dumps({'cases':cases,'pageBreakCaptures':page_break_captures},indent=2)+'\n')
