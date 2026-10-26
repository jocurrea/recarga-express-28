Set-NetConnectionProfile -InterfaceAlias 'Wi-Fi' -NetworkCategory Private -ErrorAction SilentlyContinue
netsh advfirewall firewall delete rule name="NextJS 3000"
netsh advfirewall firewall add rule name="NextJS 3000" dir=in action=allow protocol=TCP localport=3000 profile=any
