@echo off
set PYTHONIOENCODING=utf-8
cd /d C:\Users\mimiz\Projects\emakimono-next
py -3.14 scripts\analytics\fetch_all.py >> analytics\fetch.log 2>&1