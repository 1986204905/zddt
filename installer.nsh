!define MUI_LANGUAGE "Chinese"
Unicode true

!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"
!include "nsProcess.nsh"

!include "MUI.nsh"

!include nsDialogs.nsh
!include LogicLib.nsh


!insertmacro MUI_PAGE_WELCOME

Var Dialog
Var other0
Var other1
Var other2
Var other3
Var saveOther0
Var saveOther1
Var saveOther2
Var saveOther3
Var PARAMETER_PAGE_TITLE
Var PARAMETER_PAGE_SUBTITLE


Page custom pgPageCreate pgPageLeave


Function pgPageCreate
    
    ${If} $saveOther0 != "" 
        StrCpy $other0 $saveOther0
        ${ELSE}
            StrCpy $other0 "5"
    ${EndIf}   

    ${If} $saveOther1 != "" 
        StrCpy $other1 $saveOther1
        ${ELSE}
            StrCpy $other1 "15"
    ${EndIf}   
    
    ${If} $saveOther2 != "" 
        StrCpy $other2 $saveOther2
        ${ELSE}
            StrCpy $other2 "2000"
    ${EndIf}   

    ${If} $saveOther3 != "" 
        StrCpy $other3 $saveOther3
        ${ELSE}
            StrCpy $other3 "2400"
    ${EndIf}               

    StrCpy $PARAMETER_PAGE_TITLE "参数配置"
    StrCpy $PARAMETER_PAGE_SUBTITLE "请填写完成后点击下一步。"
    !insertmacro MUI_HEADER_TEXT $PARAMETER_PAGE_TITLE $PARAMETER_PAGE_SUBTITLE


    nsDialogs::Create 1018
    Pop $Dialog

    ${If} $Dialog == error
        Abort
    ${EndIf}

    ${NSD_CreateGroupBox} 10% 10u 80% 100u "参数配置"
    Pop $0

        ${NSD_CreateLabel} 20% 26u 20% 10u "最小错题数量:"
        Pop $0

        ${NSD_CreateText} 40% 24u 40% 12u "$other0"
        Pop $other0

        ${NSD_CreateLabel} 20% 40u 20% 10u "最大错题数量:"
        Pop $0

        ${NSD_CreateText} 40% 38u 40% 12u "$other1"
        Pop $other1

        ${NSD_CreateLabel} 20% 54u 20% 10u "最小时间(秒):"
        Pop $0

        ${NSD_CreateText} 40% 52u 40% 12u "$other2"
        Pop $other2
        
        ${NSD_CreateLabel} 20% 68u 20% 10u "最大时间(秒):"
        Pop $0

        ${NSD_CreateText} 40% 66u 40% 12u "$other3"
        Pop $other3

    nsDialogs::Show
FunctionEnd

Function PgPageLeave
    ${NSD_GetText} $other0 $9
    ${NSD_GetText} $other1 $1
    ${NSD_GetText} $other2 $2
    ${NSD_GetText} $other3 $3

    StrCpy $saveOther0 $9
    StrCpy $saveOther1 $1
    StrCpy $saveOther2 $2
    StrCpy $saveOther3 $3


    ${If}   $9 == ""
        ${OrIf} $1 == ""
            ${OrIf} $2 == ""
               ${OrIf} $3 == "" 
            MessageBox MB_OK "请将信息输入完整再点击下一步！"
            Abort
    ${EndIf}

    StrCpy $other0 $9
    StrCpy $other1 $1
    StrCpy $other2 $2
    StrCpy $other3 $3

        ; SetOutPath "$APPDATA\automatic-answers-data"
        ; CreateDirectory "$APPDATA\automatic-answers-data"

        ; StrCpy $0 {"wtMinFailedCount":"$9","wtMaxFailedCount":"$1","minTotalTime":"$2","maxTotalTime":"$3"}
        ; FileOpen $5 "$APPDATA\automatic-answers-data\config.json" "w"
        ; FileWrite $5 $0
        ; FileClose $5

FunctionEnd



Function .onInstSuccess
    ; MessageBox MB_YESNO "$other0"
    ; StrCpy $0 "$INSTDIR\config.json"

        SetOutPath "$INSTDIR"

        ; StrCpy $0 {"connectOverCDPPort": "9222","pageGotoPath": "https://www.xt008.cn/","loginRequestURL": "https://www.xt008.cn/jgt/mlogin/login","tkPath": "./tk.xlsx","accountPath": "./account.xlsx","wtMinFailedCount":"$other0","wtMaxFailedCount":"$other1","minTotalTime":"$other2","maxTotalTime":"$other3"}
        ; StrCpy $0 {"connectOverCDPPort": "9222","pageGotoPath": "https://www.xt008.cn/","loginRequestURL": "https://www.xt008.cn/jgt/mlogin/login"}
    ;         StrCpy $1 '{"connectOverCDPPort": "9222",'
    ; StrCpy $1 '$1 "pageGotoPath": "https://www.xt008.cn/",'
    ; StrCpy $1 '$1 "loginRequestURL": "https://www.xt008.cn/jgt/mlogin/login",'
    ; StrCpy $1 '$1 "tkPath": "./tk.xlsx",'
    ; StrCpy $1 '$1 "accountPath": "./account.xlsx",'
    ; StrCpy $1 '$1 "wtMinFailedCount": "' $other0 '",'
    ; StrCpy $1 '$1 "wtMaxFailedCount": "' $other1 '",'
    ; StrCpy $1 '$1 "minTotalTime": "' $other2 '",'
    ; StrCpy $1 '$1 "maxTotalTime": "' $other3 '"}'

    ; ; StrCpy $0 "{\r\n  \"connectOverCDPPort\": 9222,\r\n  \"pageGotoPath\": \"https://www.xt008.cn/\",\r\n  \"loginRequestURL\": \"https://www.xt008.cn/jgt/mlogin/login\",\r\n  \"tkPath\": \"./tk.xlsx\",\r\n  \"accountPath\": \"./account.xlsx\",\r\n  \"wtMinFailedCount\": \"$other0\",\r\n  \"wtMaxFailedCount\": \"$other1\",\r\n  \"minTotalTime\": \"$other2\",\r\n  \"maxTotalTime\": \"$other3\"\r\n}"

    ; MessageBox MB_YESNO "$1"

    ;     FileOpen $5 "$INSTDIR\config.json" "w"
    ;     FileWrite $5 $0
    ;     FileClose $5


Push 5 #text to be replaced
Push $other0 #replace with
Push 0 #start replacing after 3rd occurrence
Push 1 #replace next 4 occurrences
Push "$INSTDIR\config.json"
Call AdvReplaceInFile

Push 15 #text to be replaced
Push $other1 #replace with
Push 0 #start replacing after 3rd occurrence
Push 1 #replace next 4 occurrences
Push "$INSTDIR\config.json"
Call AdvReplaceInFile

Push 2000 #text to be replaced
Push $other2 #replace with
Push 0 #start replacing after 3rd occurrence
Push 1 #replace next 4 occurrences
Push "$INSTDIR\config.json"
Call AdvReplaceInFile

Push 2400 #text to be replaced
Push $other3 #replace with
Push 0 #start replacing after 3rd occurrence
Push 1 #replace next 4 occurrences
Push "$INSTDIR\config.json"
Call AdvReplaceInFile        

FunctionEnd


Function AdvReplaceInFile
Exch $0 ;file to replace in
Exch
Exch $1 ;number to replace after
Exch
Exch 2
Exch $2 ;replace and onwards
Exch 2
Exch 3
Exch $3 ;replace with
Exch 3
Exch 4
Exch $4 ;to replace
Exch 4
Push $5 ;minus count
Push $6 ;universal
Push $7 ;end string
Push $8 ;left string
Push $9 ;right string
Push $R0 ;file1
Push $R1 ;file2
Push $R2 ;read
Push $R3 ;universal
Push $R4 ;count (onwards)
Push $R5 ;count (after)
Push $R6 ;temp file name

  GetTempFileName $R6
  FileOpen $R1 $0 r ;file to search in
  FileOpen $R0 $R6 w ;temp file
   StrLen $R3 $4
   StrCpy $R4 -1
   StrCpy $R5 -1

loop_read:
 ClearErrors
 FileRead $R1 $R2 ;read line
 IfErrors exit

   StrCpy $5 0
   StrCpy $7 $R2

loop_filter:
   IntOp $5 $5 - 1
   StrCpy $6 $7 $R3 $5 ;search
   StrCmp $6 "" file_write1
   StrCmp $6 $4 0 loop_filter

StrCpy $8 $7 $5 ;left part
IntOp $6 $5 + $R3
IntCmp $6 0 is0 not0
is0:
StrCpy $9 ""
Goto done
not0:
StrCpy $9 $7 "" $6 ;right part
done:
StrCpy $7 $8$3$9 ;re-join

IntOp $R4 $R4 + 1
StrCmp $2 all loop_filter
StrCmp $R4 $2 0 file_write2
IntOp $R4 $R4 - 1

IntOp $R5 $R5 + 1
StrCmp $1 all loop_filter
StrCmp $R5 $1 0 file_write1
IntOp $R5 $R5 - 1
Goto file_write2

file_write1:
 FileWrite $R0 $7 ;write modified line
Goto loop_read

file_write2:
 FileWrite $R0 $R2 ;write unmodified line
Goto loop_read

exit:
  FileClose $R0
  FileClose $R1

   SetDetailsPrint none
  Delete $0
  Rename $R6 $0
  Delete $R6
   SetDetailsPrint lastused

Pop $R6
Pop $R5
Pop $R4
Pop $R3
Pop $R2
Pop $R1
Pop $R0
Pop $9
Pop $8
Pop $7
Pop $6
Pop $5
;These values are stored in the stack in the reverse order they were pushed
Pop $0
Pop $1
Pop $2
Pop $3
Pop $4
FunctionEnd

Section "Install"
   ; 检查 account.xlsx 文件是否存在
    IfFileExists "$EXEDIR\account.xlsx" +2 0
        MessageBox MB_OK "未检测到 account.xlsx 文件，请安装点击完成后手动将 account.xlsx 文件 添加至 $INSTDIR 目录下。"
        ; Abort

   ; 复制外部文件到安装目录
    CopyFiles /SILENT /FILESONLY "$EXEDIR\account.xlsx" "$INSTDIR\account.xlsx"
    DetailPrint "account.xlsx has been copied from $EXEDIR to $INSTDIR"
SectionEnd

