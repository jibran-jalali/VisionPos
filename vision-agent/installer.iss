; VisionPOS Engine Installer
; Requires Inno Setup 6+ (https://jrsoftware.org/isinfo.php)
; Build with: ISCC.exe "VisionPOS Engine.iss"

#define MyAppName "VisionPOS Engine"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "VisionPOS"
#define MyAppURL "http://localhost:3000"
#define MyAppExeName "VisionPOS Engine.exe"

[Setup]
AppId={{B8F4A3D2-1C5E-4A7B-9D6F-8E2C1A3B5D7F}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={autopf}\VisionPOS Engine
DefaultGroupName=VisionPOS
AllowNoIcons=yes
OutputDir=installer
OutputBaseFilename=VisionPOS-Engine-Setup
SetupIconFile=engine.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"; Flags: checkedonce

[Files]
Source: "dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "engine.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Launch VisionPOS Engine"; Flags: nowait postinstall skipifsilent unchecked

[UninstallRun]
Filename: "{cmd}"; Parameters: "/C taskkill /F /IM ""VisionPOS Engine.exe"" /T >nul 2>&1"; Flags: runhidden

[Code]
procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = wpSelectTasks then
    WizardForm.TasksList.Checked[0] := True;
end;
