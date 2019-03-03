# SFViewer (0.0.1)

## Overview

This is a basic app that connects to a Salesforce environment using oAuth and provides a list of objects and their definitions to browse, without using any frameworks or external libraries. This is purely a personal project for learning purposes at the moment, as you could achieve this much quicker using Express and JSforce. In its early state, the code is simply a proof of concept and has not been cleaned up, modularized, or even commented well. I'm not sure how far I'll take this, but I'll probably improve this occasionally as time allows.

## Use

Note: You will need to have environment variables SFClientKey and SFClientSecret set using the appropriate values from your Salesforce environment.

To use: Navigate to "/sf" on the local server. This will automatically begin the oauth process and send you to the Salesforce login screen. Upon logging in, you will be redirected back to a screen confirming your access token (again, this is simply for learning purposes). You can click through to a list of objects and each object will link to a list of fields.