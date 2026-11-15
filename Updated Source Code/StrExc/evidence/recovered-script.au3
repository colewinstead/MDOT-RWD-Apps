Global Const $GUI_EVENT_CLOSE = - 3
Global Const $GUI_EVENT_MINIMIZE = - 4
Global Const $GUI_EVENT_RESTORE = - 5
Global Const $GUI_EVENT_MAXIMIZE = - 6
Global Const $GUI_EVENT_PRIMARYDOWN = - 7
Global Const $GUI_EVENT_PRIMARYUP = - 8
Global Const $GUI_EVENT_SECONDARYDOWN = - 9
Global Const $GUI_EVENT_SECONDARYUP = - 10
Global Const $GUI_EVENT_MOUSEMOVE = - 11
Global Const $GUI_EVENT_RESIZED = - 12
Global Const $GUI_EVENT_DROPPED = - 13
Global Const $GUI_RUNDEFMSG = "GUI_RUNDEFMSG"
Global Const $GUI_AVISTOP = 0
Global Const $GUI_AVISTART = 1
Global Const $GUI_AVICLOSE = 2
Global Const $GUI_CHECKED = 1
Global Const $GUI_INDETERMINATE = 2
Global Const $GUI_UNCHECKED = 4
Global Const $GUI_DROPACCEPTED = 8
Global Const $GUI_NODROPACCEPTED = 4096
Global Const $GUI_ACCEPTFILES = $GUI_DROPACCEPTED
Global Const $GUI_SHOW = 16
Global Const $GUI_HIDE = 32
Global Const $GUI_ENABLE = 64
Global Const $GUI_DISABLE = 128
Global Const $GUI_FOCUS = 256
Global Const $GUI_NOFOCUS = 8192
Global Const $GUI_DEFBUTTON = 512
Global Const $GUI_EXPAND = 1024
Global Const $GUI_ONTOP = 2048
Global Const $GUI_FONTITALIC = 2
Global Const $GUI_FONTUNDER = 4
Global Const $GUI_FONTSTRIKE = 8
Global Const $GUI_DOCKAUTO = 1
Global Const $GUI_DOCKLEFT = 2
Global Const $GUI_DOCKRIGHT = 4
Global Const $GUI_DOCKHCENTER = 8
Global Const $GUI_DOCKTOP = 32
Global Const $GUI_DOCKBOTTOM = 64
Global Const $GUI_DOCKVCENTER = 128
Global Const $GUI_DOCKWIDTH = 256
Global Const $GUI_DOCKHEIGHT = 512
Global Const $GUI_DOCKSIZE = 768
Global Const $GUI_DOCKMENUBAR = 544
Global Const $GUI_DOCKSTATEBAR = 576
Global Const $GUI_DOCKALL = 802
Global Const $GUI_DOCKBORDERS = 102
Global Const $GUI_GR_CLOSE = 1
Global Const $GUI_GR_LINE = 2
Global Const $GUI_GR_BEZIER = 4
Global Const $GUI_GR_MOVE = 6
Global Const $GUI_GR_COLOR = 8
Global Const $GUI_GR_RECT = 10
Global Const $GUI_GR_ELLIPSE = 12
Global Const $GUI_GR_PIE = 14
Global Const $GUI_GR_DOT = 16
Global Const $GUI_GR_PIXEL = 18
Global Const $GUI_GR_HINT = 20
Global Const $GUI_GR_REFRESH = 22
Global Const $GUI_GR_PENSIZE = 24
Global Const $GUI_GR_NOBKCOLOR = - 2
Global Const $GUI_BKCOLOR_DEFAULT = - 1
Global Const $GUI_BKCOLOR_TRANSPARENT = - 2
Global Const $GUI_BKCOLOR_LV_ALTERNATE = 4261412864
Global Const $GUI_WS_EX_PARENTDRAG = 1048576
$DIAMETERSPAN = "Round"
$STRTOTAL = 0
$TOTAL = 0
$CHK = 1
MsgBox ( 0 , "Structure Excavation Intro" , "EST. STRUCTURE EXCAVATION program writes its results to a text file. You must create this text file in the next step. The next dialog allows you to select a project folder and text file name or you can use the default file name that is entered for you. Click OK to continue..." )
$FILE = FileSaveDialog ( "Select a folder & file for STRUCTURE EXCAVATION" , "C:\Q" , "Text files (*.txt)" , 16 , "exc.txt" )
If @error = 1 Then
	Exit
EndIf
FileOpen ( $FILE , 2 )
FileWriteLine ( $FILE , "ESTIMATED STRUCTURE EXCAVATION QUANTITIES - " & @MON & "/" & @MDAY & "/" & @YEAR )
FileWriteLine ( $FILE , "--------------------------------------------------------" )
FileWriteLine ( $FILE , "" )
GUICreate ( "Structure Excavation" , 275 , 230 , 100 , 100 )
GUICtrlCreateLabel ( "Mississippi DOT (Roadway Design) - Version 1.1" , 30 , 5 , 240 , 20 )
GUICtrlCreateLabel ( "------------------------------------------------------------------------------------------------" , 5 , 20 , 295 , 10 )
$LABEL_STA = GUICtrlCreateInput ( "" , 5 , 35 , 70 , 20 )
GUICtrlCreateLabel ( "Pipe Station (xx+xx):" , 80 , 40 , 200 , 20 )
$LABEL_LOP = GUICtrlCreateInput ( "" , 5 , 60 , 70 , 20 )
GUICtrlCreateLabel ( "Length Of Pipe (ft):" , 80 , 65 , 130 , 20 )
$COMBO_DS = GUICtrlCreateCombo ( "" , 5 , 85 , 55 , 20 )
GUICtrlSetData ( $COMBO_DS , "|18|24|30|36|42|48|54|60|66|72|84|22x13|29x18|36x26|44x27|51x31|58x36|65x40|73x45|88x54" , "18" )
GUICtrlCreateLabel ( "Pipe Size(in) - Type = " , 65 , 90 , 130 , 20 )
$LABEL_DSOUT = GUICtrlCreateInput ( "" , 170 , 90 , 40 , 18 )
$COMBO_FES = GUICtrlCreateCombo ( "" , 5 , 110 , 55 , 20 )
GUICtrlSetData ( $COMBO_FES , "|0|1|2" , "0" )
GUICtrlCreateLabel ( "Number of FES(if any):" , 65 , 110 , 130 , 20 )
$LABEL_DEP = GUICtrlCreateInput ( "" , 5 , 135 , 55 , 20 )
GUICtrlCreateLabel ( "Average Depth of Excavation.(ft):" , 65 , 135 , 200 , 20 )
GUICtrlCreateLabel ( "------------------------------------------------------------------------------------------------" , 5 , 165 , 295 , 10 )
$BUTTON_CALC = GUICtrlCreateButton ( "CALCULATE" , 5 , 180 , 80 , 25 )
$LABEL_TOTAL = GUICtrlCreateInput ( "" , 145 , 185 , 45 , 20 )
GUICtrlCreateLabel ( " C.Y." , 190 , 190 , 30 , 20 )
GUISetState ( )
While 1
	$MSG = GUIGetMsg ( )
	If GUICtrlRead ( $COMBO_DS ) == "18" Then
		$DIAMETERSPAN = "Round"
		$CY = 1.18
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "24" Then
		$DIAMETERSPAN = "Round"
		$CY = 1.41
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "30" Then
		$DIAMETERSPAN = "Round"
		$CY = 1.63
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "36" Then
		$DIAMETERSPAN = "Round"
		$CY = 2.34
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "42" Then
		$DIAMETERSPAN = "Round"
		$CY = 2.53
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "48" Then
		$DIAMETERSPAN = "Round"
		$CY = 2.71
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "54" Then
		$DIAMETERSPAN = "Round"
		$CY = 2.94
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "60" Then
		$DIAMETERSPAN = "Round"
		$CY = 3.12
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "66" Then
		$DIAMETERSPAN = "Round"
		$CY = 3.31
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "72" Then
		$DIAMETERSPAN = "Round"
		$CY = 3.48
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "84" Then
		$DIAMETERSPAN = "Round"
		$CY = 5.86
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "22x13" Then
		$DIAMETERSPAN = "Arch"
		$CY = 1.2
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "29x18" Then
		$DIAMETERSPAN = "Arch"
		$CY = 1.43
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "36x26" Then
		$DIAMETERSPAN = "Arch"
		$CY = 1.66
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "44x27" Then
		$DIAMETERSPAN = "Arch"
		$CY = 2.4
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "51x31" Then
		$DIAMETERSPAN = "Arch"
		$CY = 2.59
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "58x36" Then
		$DIAMETERSPAN = "Arch"
		$CY = 2.8
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "65x40" Then
		$DIAMETERSPAN = "Arch"
		$CY = 2.98
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "73x45" Then
		$DIAMETERSPAN = "Arch"
		$CY = 3.19
	EndIf
	If GUICtrlRead ( $COMBO_DS ) == "88x54" Then
		$DIAMETERSPAN = "Arch"
		$CY = 3.91
	EndIf
	GUICtrlSetData ( $LABEL_DSOUT , $DIAMETERSPAN )
	Select
	Case $MSG = $BUTTON_CALC
		$H = GUICtrlRead ( $LABEL_STA )
		$L = GUICtrlRead ( $LABEL_LOP )
		$D = GUICtrlRead ( $COMBO_DS )
		$C = GUICtrlRead ( $LABEL_DEP )
		$F = GUICtrlRead ( $COMBO_FES )
		$CHK = 1
		If GUICtrlRead ( $COMBO_FES ) = 0 Then
			$CY = 0
		EndIf
		$TOTAL = ( ( ( ( ( $D + 24 ) / 12 ) * $L * $C ) / 27 ) + ( $F * $CY * $C ) )
		$RTOTAL = Round ( $TOTAL , 3 )
		GUICtrlSetData ( $LABEL_TOTAL , $RTOTAL )
		$STRTOTAL = $STRTOTAL + $TOTAL
		If GUICtrlRead ( $LABEL_LOP ) <= 0 Then
			MsgBox ( 4096 , "" , "Length of Pipe Not Set" )
			GUICtrlSetData ( $L , "" )
			GUICtrlSetData ( $D , "" )
			GUICtrlSetData ( $C , "" )
			GUICtrlSetData ( $F , "" )
			GUICtrlSetData ( $LABEL_TOTAL , "" )
			$CHK = 0
		EndIf
		If GUICtrlRead ( $LABEL_DEP ) <= 0 Then
			MsgBox ( 4096 , "" , "Average Depth Not Set" )
			GUICtrlSetData ( $L , "" )
			GUICtrlSetData ( $D , "" )
			GUICtrlSetData ( $C , "" )
			GUICtrlSetData ( $F , "" )
			GUICtrlSetData ( $LABEL_TOTAL , "" )
			$CHK = 0
		EndIf
		If $CHK = 1 Then
			FileWriteLine ( $FILE , "STA." & $H & @TAB & "Length=" & $L & @TAB & "Dia./Span=" & $D & @TAB & "FES: " & $F )
			FileWriteLine ( $FILE , "Avr.Depth=" & $C & @TAB & "CU.YDS.: " & $RTOTAL )
			FileWriteLine ( $FILE , "" )
		EndIf
	Case $MSG = $GUI_EVENT_CLOSE
		$STRTOTAL = Round ( $STRTOTAL , 2 )
		FileWriteLine ( $FILE , "--------------------------------------------------------" )
		FileWriteLine ( $FILE , "TOTAL FOR STRUCTURE EXCAVATION IS: " & $STRTOTAL & " C.Y." )
		FileClose ( $FILE )
		ShellExecute ( $FILE )
		ExitLoop
	EndSelect
WEnd
