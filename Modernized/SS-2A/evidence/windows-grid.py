import runpy,json,subprocess
from pathlib import Path
m=runpy.run_path('Modernized/SS-2A/evidence/windows-characterize.py');c=m['command'];run=m['run'];R=m['ROOT'];H=m['HOST']
cases=[(5,4,4,'N',[(1,0,0)]),(5,4,4,'Y',[(2,2,0)]),(10,5,6,'N',[(1,0,1)]),(10,5,6,'Y',[(2,2,1)]),(15,6,7,'N',[(1,10,0)]),(15,6,7,'Y',[(3,7,1)]),(5,3,3,'N',[]),(5,4,4,'N',[(1,0,0),(2,0,1)])]
fixtures=[]
for i,(L,W,T,pav,opens) in enumerate(cases,1):
 keys=(['TEST{ENTER}','TEST{ENTER}'] if i==1 else ['Y'])+[f'{10000+i}'+ '{ENTER}','L' if i%2 else 'R',f'{L}'+'{ENTER}',f'{W}'+'{ENTER}',f'{T}'+'{ENTER}',pav]
 c(f'legacy-grid-input{i}',keys)
 pipes=[]
 for count,row,col in opens:
  pipes += [str(count)+'{ENTER}']+(['{RIGHT}'] if col else [])+['{DOWN}']*row+['{ENTER}']
 pipes+=['{PAGEUP}']
 c(f'legacy-grid-case{i}',pipes)
 out=run(['ssh',H,f'powershell -NoProfile -File C:/Users/colew/SS2PilotTest/windows-read.ps1 -Count {i}'])
 fixtures.append({'length':L,'width':W,'height':T,'pavement':pav=='Y','openings':opens,'observed':json.loads(out)})
 (R/'legacy-grid-results.json').write_text(json.dumps({'cases':fixtures},indent=2))
c('legacy-grid-save-prompt',['N']);c('legacy-grid-save',['Y'])
run(['scp',H+':C:/S/SS-2A.TXT',str(R/'legacy-report-grid.txt')])
