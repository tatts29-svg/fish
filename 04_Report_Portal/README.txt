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

Updating from the browser (no laptop kit needed):
  https://SITE/upload   Any login. Drop in the SiteIQ exports
  from one pull (rental stock, sales stock, transactions; stocktake and on
  hire are optional). The site rebuilds the report, the on-hire Excel and
  both PDFs, and swaps them in together only if the whole build works.

  This needs the Dockerfile build (repo root as the build folder,
  04_Report_Portal/Dockerfile) and the job pack loaded once by the Manager:
    curl -u USER -T job_pack.zip https://SITE/upload/pack.zip
  The pack holds job.json, the kit folder (JOB.txt, alias files, _fonts) and
  the reference files, pictures and workbooks job.json points at. It is site
  data and is never in git. Optional Store login: STORE_USERNAME, STORE_PASSWORD.
