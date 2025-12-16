# QABot Feature Description

Speedscale QABot automates the creation of realistic and reliable tests and service mocks using traffic replay. The user records a running instance of their application and then replays the traffic against the application two or more times. The recording of the traffic covers both inbound and outbound HTTP, API and Database requests. MockBot compares the results of the runs and generates data modification suggestions called Recommendations. These Recommendations are automatically applied to the original snapshot to improve the accuracy of the service mocks and tests.

Traffic replay solves the problem of needing to write test scripts that immediately fall out of date. QABot solves the data integrity problem that prevents test scripts and mocks from working reliably in a CI pipeline. The types of problems QABot will find include OAuth authorization from clients, timestamp shifts and rotating IDs that prevent good service mock responses, amongst others.

To operate QABot, the user takes the following high level steps:
1. Record a snapshot of their application running
2. Provide a test application that QABot can run multiple tests against
3. Run QABot comparator. QABot will re-run test scenarios against the application to see what changes between runs.
4. QABot will propose and apply a set of Recommendations to the original snapshot
5. The use should now have a more reliable set of paired service mocks and tests to insert in the CI pipeline for reliable regression or performance replay
