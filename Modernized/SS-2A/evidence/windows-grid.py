import runpy,json,subprocess
from pathlib import Path
m=runpy.run_path('Modernized/SS-2A/evidence/windows-characterize.py');c=m['command'];run=m['run'];R=m['ROOT'];H=m['HOST']
cases=[(5,4,4,'N',[(1,0,0)]),(5,4,4,'Y',[(2,2,0)]),(10,5,6,'N',[(1,0,1)]),(10,5,6,'Y',[(2,2,1)]),(15,6,7,'N',[(1,10,0)]),(15,6,7,'Y',[(3,7,1)]),(5,3,3,'N',[]),(5,4,4,'N',[(1,0,0),(2,0,1)])]
fixtures=[]
for i,(L,W,T,pav,opens) in enumerate(cases,1):
 run(['ssh',H,'powershell -NoProfile -Command "Stop-Process -Id ([int](Get-Content C:\\Users\\colew\\SS2PilotTest\\legacy.pid)) -ErrorAction SilentlyContinue"'])
 run(['ssh',H,'powershell -NoProfile -File C:/Users/colew/SS2PilotTest/start-probe.ps1'])
 keys=['TEST{ENTER}','TEST{ENTER}']+[f'{10000+i}'+ '{ENTER}','L' if i%2 else 'R',(str(L)+'{ENTER}' if L==5 else str(L)),f'{W}'+'{ENTER}',f'{T}'+'{ENTER}',pav]
 c(f'legacy-final-input{i}',keys)
 pipes=[str(sum(x[0] for x in opens))]
 lastrow=0;lastcol=0
 for count,row,col in opens:
  for n in range(count):
   if col!=lastcol:pipes += ['{RIGHT}' if col else '{LEFT}']
   pipes += ['{DOWN}']*max(0,row-lastrow)+['{UP}']*max(0,lastrow-row)+['{ENTER}']
   lastrow=row;lastcol=col
 pipes+=['{PAGEUP}']
 c(f'legacy-final-case{i}',pipes)
 out=run(['ssh',H,f'powershell -NoProfile -File C:/Users/colew/SS2PilotTest/windows-read.ps1 -Count 1'])
 fixtures.append({'resultIndex':1,'length':L,'width':W,'height':T,'pavement':pav=='Y','openings':opens,'observed':json.loads(out)})
 (R/'legacy-grid-results.json').write_text(json.dumps({'cases':fixtures},indent=2))
print('fresh grid complete')
