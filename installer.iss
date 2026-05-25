[Setup]
; App Information
AppName=Lumina Video Downloader
AppVersion=1.0
AppPublisher=Lumina
AppPublisherURL=https://github.com/Himanshu478140/Lumina_Video
AppSupportURL=https://github.com/Himanshu478140/Lumina_Video
AppUpdatesURL=https://github.com/Himanshu478140/Lumina_Video

; Installation paths
DefaultDirName={autopf}\Lumina Video Downloader
DisableProgramGroupPage=yes

; Output file settings
OutputDir=dist
OutputBaseFilename=LuminaVideo_Setup
SetupIconFile=icon.ico
Compression=lzma2/ultra64
SolidCompression=yes

; Permissions
PrivilegesRequired=lowest

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Copy the executable we built
Source: "dist\LuminaVideo.exe"; DestDir: "{app}"; Flags: ignoreversion
; Copy the icon for the desktop shortcut
Source: "icon.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; Start Menu Icon
Name: "{autoprograms}\Lumina Video Downloader"; Filename: "{app}\LuminaVideo.exe"; IconFilename: "{app}\icon.ico"
; Desktop Icon
Name: "{autodesktop}\Lumina Video Downloader"; Filename: "{app}\LuminaVideo.exe"; IconFilename: "{app}\icon.ico"; Tasks: desktopicon

[Run]
; Option to launch the app immediately after installation
Filename: "{app}\LuminaVideo.exe"; Description: "{cm:LaunchProgram,Lumina Video Downloader}"; Flags: nowait postinstall skipifsilent
