@echo off
title Scalezix - Project 1: Proposal & Scope-of-Work Assistant
echo ======================================================================
echo  SCALEZIX - PROJECT 1: PROPOSAL & SCOPE-OF-WORK ASSISTANT
echo ======================================================================
echo.
echo Starting React Vite Frontend on http://localhost:5173 ...
start "Scalezix Project 1 - Frontend" cmd /k "cd /d "%~dp001-Proposal-Scope-Assistant" && npm run dev"

timeout /t 2 /nobreak > nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ======================================================================
echo  Project 1 is running at http://localhost:5173/
echo ======================================================================
pause

