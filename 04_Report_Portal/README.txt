Report portal - a login-protected home for one client report page.
Author: Andrew Fisher | POWERED BY SITEIQ

server.py serves the report page built by 02_Onhire_Report_Kit/build_showcase.py
to people who sign in. The report is uploaded by a Manager and kept on the
host's volume (DATA_DIR); it is never in git.

Host settings: start command "python server.py", health check /health, a
volume mounted at /data, and the variables CLIENT_USERNAME, CLIENT_PASSWORD,
MANAGER_USERNAME, MANAGER_PASSWORD.

Load a new report (Manager login):
  curl -u USER -T report.html https://SITE/upload/report.html
  curl -u USER -T report.pdf  https://SITE/upload/report.pdf
