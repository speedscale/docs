---
description: See the sequence of calls from each of the Speedscale components.
---

# Logs

During the traffic replay there are several moving parts. The "View logs" button is available in the upper right-hand corner of any Report. The logs list shows the system logs from various components:

* **Operator** from the cluster orchestrates the initialization of the responder and generator and cleans up the environment at the end.
* **Responder** is used to create a stable environment, you may want to review the exact settings used
* **Generator** performs the traffic replay, you may want to review the specific log statements as it ran
* **Analyzer** calculates the assertions and determines which results pass and fail.

![Replay Logs](<../../.gitbook/assets/Screen Shot 2021-08-13 at 11.54.51 AM.png>)
