# herrmanns-reisen-bot
Bot for https://herrmanns.reisen

# Workflow
- User goes to https://herrmanns.in/birmingham
- If User is not known (localStorage), they get an input field
  - 'Hi, my name is JOHN DOE and I want to receive updates to JOHN@DOE.COM'
  - Telegram message sent via Bot (in group?):
    - JOHN DOE (JOHN@DOE.COM) wants to receive updates
    - Buttons: Accept / Deny
  - When User is accepted in Telegram
    - they are added to the mailgun mailing list
    - they receive an email with a unique access link:
      - https://herrmanns.in/birmingham?access=FIE38942FJID
      - the access key is stored in localStorage
      - the user gets redirected to https://herrmanns.in/birmingham
- If User is known but not accepted (localStorage), they get a message:
  - Wait for Herrmanns to verify your request...
- If User is known and accepted (localStorage unique access id), they...
