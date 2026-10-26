@echo off
title Desbloquear Acceso Red Local - Recarga Express 28
color 0a

echo ======================================================================
echo    CONFIGURANDO ACCESO DE RED LOCAL PARA RECARGA EXPRESS 28
echo ======================================================================
echo.

echo 1. Cambiando perfil de red Wi-Fi a Privada...
powershell -NoProfile -Command "Set-NetConnectionProfile -InterfaceAlias 'Wi-Fi' -NetworkCategory Private -ErrorAction SilentlyContinue"

echo 2. Abriendo el puerto 3000 en el Firewall de Windows...
netsh advfirewall firewall delete rule name="NextJS 3000" >nul 2>&1
netsh advfirewall firewall add rule name="NextJS 3000" dir=in action=allow protocol=TCP localport=3000 profile=any >nul 2>&1

echo 3. Permitiendo Node.js en el Firewall...
netsh advfirewall firewall delete rule name="NodeJS Recarga" >nul 2>&1
netsh advfirewall firewall add rule name="NodeJS Recarga" dir=in action=allow program="C:\nvm4w\nodejs\node.exe" profile=any >nul 2>&1

echo.
echo ======================================================================
echo    LISTO! PUERTO Y RED DESBLOQUEADOS CON EXITO
echo ======================================================================
echo.
echo Ya puedes entrar desde tu telefono o cualquier otro equipo en el mismo
echo Wi-Fi abriendo este enlace en el navegador:
echo.
echo    http://192.168.101.8:3000
echo.
echo ======================================================================
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
