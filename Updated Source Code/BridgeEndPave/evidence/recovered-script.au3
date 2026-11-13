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
Global $GT42RAIL , $GT32RAIL , $W1 , $W2 , $SKEW , $RH , $DABE , $WB , $W , $SIDEA , $SIDEB , $Y , $EJ , $YD , $T32RAIL , $T42RAIL , $GTYD , $GTEJ , $GTTG
MsgBox ( 0 , "Bridge End Pavt Intro" , "BRIDGE END PAVEMENT program writes its results to a text file. You must create this text file in the next step. The next dialog allows you to select a project folder and text file name or you can use the default file name that is entered for you. Click OK to continue..." )
$FILE = FileSaveDialog ( "Select a folder & file for Bridge End Quantities..." , "" , "Text files (*.txt)" , 16 , "BridgeEndPave.txt" )
$FULLFILE = $FILE
If @error = 1 Then
	MsgBox ( 0 , "ERROR" , "Unable Save File to Selected Folder" )
	Exit
EndIf
FileOpen ( $FILE , 2 )
FileWriteLine ( $FILE , "" )
FileWriteLine ( $FILE , "ESTIMATED BRIDGE END PAVEMENT QUANTITIES - " & @MON & "/" & @MDAY & "/" & @YEAR )
FileWriteLine ( $FILE , "---------------------------------------------------------------------" )
FileWriteLine ( $FILE , "" )
GUICreate ( "Bridge End Pavement" , 275 , 300 , 100 , 100 )
GUICtrlCreateLabel ( "Mississippi DOT (Roadway Design) - Version AI 1.2" , 30 , 5 , 240 , 20 )
GUICtrlCreateLabel ( "--------------------------------------------------------------------------------------" , 1 , 20 , 295 , 10 )
$LABEL_STA = GUICtrlCreateInput ( "" , 5 , 35 , 70 , 20 )
GUICtrlCreateLabel ( "Br. Abut. Station ( xx+xx.xx)" , 80 , 40 , 200 , 20 )
$LABEL_W1 = GUICtrlCreateInput ( "" , 5 , 60 , 70 , 20 )
GUICtrlCreateLabel ( "W1 ( ft ):" , 80 , 65 , 130 , 20 )
$LABEL_W2 = GUICtrlCreateInput ( "" , 5 , 85 , 70 , 20 )
GUICtrlCreateLabel ( "W2 ( ft ):" , 80 , 90 , 200 , 20 )
$LABEL_SKEW = GUICtrlCreateInput ( "" , 5 , 110 , 70 , 20 )
GUICtrlCreateLabel ( "Skew ( Z )( degrees ):" , 80 , 115 , 200 , 20 )
$COMBO_RH = GUICtrlCreateCombo ( "" , 5 , 135 , 70 , 20 )
GUICtrlSetData ( $COMBO_RH , "|0|32|42" , "0" )
GUICtrlCreateLabel ( "Rail Height ( in )" , 80 , 140 , 130 , 20 )
GUICtrlCreateLabel ( "--------------------------------------------------------------------------------------" , 1 , 160 , 295 , 10 )
$BUTTON_CALC = GUICtrlCreateButton ( "CALCULATE" , 90 , 170 , 80 , 25 )
GUICtrlCreateLabel ( "Bridge End Pavement:" , 5 , 210 , 110 , 20 )
$LABEL_BEP = GUICtrlCreateInput ( "" , 120 , 205 , 60 , 20 )
GUICtrlCreateLabel ( " S.Y." , 185 , 210 , 45 , 20 )
GUICtrlCreateLabel ( "Expansion Joint:" , 33 , 235 , 110 , 20 )
$LABEL_EJ = GUICtrlCreateInput ( "" , 120 , 230 , 60 , 20 )
GUICtrlCreateLabel ( " L.F." , 185 , 235 , 60 , 20 )
GUICtrlCreateLabel ( "Transverse Grooving:" , 7 , 260 , 110 , 20 )
$LABEL_TG = GUICtrlCreateInput ( "" , 120 , 255 , 60 , 20 )
GUICtrlCreateLabel ( " S.Y." , 185 , 260 , 60 , 20 )
GUISetState ( )
While 1
	$MSG = GUIGetMsg ( )
	Select
	Case $MSG = $BUTTON_CALC
		$STA = GUICtrlRead ( $LABEL_STA )
		$W1 = GUICtrlRead ( $LABEL_W1 )
		$W2 = GUICtrlRead ( $LABEL_W2 )
		$SKEW = GUICtrlRead ( $LABEL_SKEW )
		$RH = GUICtrlRead ( $COMBO_RH )
		$DABE = ( $SKEW ) * ( 3.141593 ) / 180
		$WB = $W1 + $W2
		If $RH = 0 Then
			$W = $WB + 1
		EndIf
		If $RH = 32 Then
			$W = $WB + 2.833333
		EndIf
		If $RH = 42 Then
			$W = $WB + 3
		EndIf
		$SIDEA = ( 20 - ( ( $W / 2 ) * Tan ( $DABE ) ) )
		If $SIDEA < 10 Then
			$SIDEA = 10
		EndIf
		If $SIDEA = 10 Then
			$SIDEB = 10 + ( $W * Tan ( $DABE ) )
		Else
			$SIDEB = 20 + ( ( $W / 2 ) * ( Tan ( $DABE ) ) )
		EndIf
		$Y = ( ( $SIDEA + $SIDEB ) / 2 ) * $W / 9
		$EJ = $W / Cos ( $DABE )
		$TG = $Y
		$YD = $Y
		$T32RAIL = 0
		$T42RAIL = 0
		If $RH = 32 Then
			$SIDEAM = ( $SIDEA - 10 ) * 0.916667 / 9
			$SIDEBM = ( $SIDEB - 10 ) * 0.916667 / 9
			$YD = $Y - ( $SIDEAM + $SIDEBM )
			$T32RAIL = 20
			$TG = $YD - 3.148148
		EndIf
		If $RH = 42 Then
			$SIDEAM = ( $SIDEA - 10 ) * 1.0 / 9
			$SIDEBM = ( $SIDEB - 10 ) * 1.0 / 9
			$YD = $Y - ( $SIDEAM + $SIDEBM )
			$T42RAIL = 20
			$TG = $YD - 3.333333
		EndIf
		$YD = Round ( $YD , 2 )
		$EJ = Round ( $EJ , 2 )
		$TG = Round ( $TG , 2 )
		$W1 = Round ( $W1 , 2 )
		$W2 = Round ( $W2 , 2 )
		$W = Round ( $W , 2 )
		$SIDEA = Round ( $SIDEA , 2 )
		$SIDEB = Round ( $SIDEB , 2 )
		$SKEW = Round ( $SKEW , 2 )
		GUICtrlSetData ( $LABEL_BEP , $YD )
		GUICtrlSetData ( $LABEL_EJ , $EJ )
		GUICtrlSetData ( $LABEL_TG , $TG )
		FileWriteLine ( $FILE , "STATION: " & $STA )
		FileWriteLine ( $FILE , " W1  " & @TAB & " W2  " & @TAB & " WB  " & @TAB & " W   " & @TAB & " A   " & @TAB & " B   " & @TAB & " Z   " )
		FileWriteLine ( $FILE , "----" & @TAB & "----" & @TAB & "----" & @TAB & "----" & @TAB & "----" & @TAB & "----" & @TAB & "----" )
		FileWriteLine ( $FILE , $W1 & @TAB & $W2 & @TAB & $WB & @TAB & $W & @TAB & $SIDEA & @TAB & $SIDEB & @TAB & $SKEW )
		FileWriteLine ( $FILE , "Bridge End Pavement... = " & $YD & " S.Y." )
		FileWriteLine ( $FILE , "Expansion Joint....... = " & $EJ & " L.F." )
		FileWriteLine ( $FILE , "Transverse Grooving... = " & $TG & " S.Y." )
		FileWriteLine ( $FILE , "32 in. Rail........... = " & $T32RAIL & " L.F." )
		FileWriteLine ( $FILE , "42 in. Rail........... = " & $T42RAIL & " L.F." )
		FileWriteLine ( $FILE , " " )
		$GTYD = $GTYD + $YD
		$GTEJ = $GTEJ + $EJ
		$GTTG = $GTTG + $TG
		$GT32RAIL = $GT32RAIL + $T32RAIL
		$GT42RAIL = $GT42RAIL + $T42RAIL
	Case $MSG = $GUI_EVENT_CLOSE
		FileWriteLine ( $FILE , "---------------------------------------------------------------------" )
		FileWriteLine ( $FILE , "TOTALS FOR BRIDGE END PAVEMENT... = " & $GTYD & " S.Y." )
		FileWriteLine ( $FILE , "TOTALS FOR EXPANSION JOINT....... = " & $GTEJ & " L.F." )
		FileWriteLine ( $FILE , "TOTALS FOR TRANSVERSE GROOVING... = " & $GTTG & " S.Y." )
		FileWriteLine ( $FILE , "TOTALS FOR 32 in. RAIL........... = " & $GT32RAIL & " L.F." )
		FileWriteLine ( $FILE , "TOTALS FOR 42 in. RAIL........... = " & $GT42RAIL & " L.F." )
		FileClose ( $FILE )
		ShellExecute ( $FILE )
		ExitLoop
	EndSelect
WEnd
