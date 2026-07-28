// EMAIL_CONFIG controls how the demo sends email notifications.
// Edit this file only if you want to change recipients or enable EmailJS.

// METHOD options:
// - 'emailjs' : use EmailJS (https://www.emailjs.com/) to send emails from client. You must create a service, template and get a user id.
// - null / undefined: no configured method; the demo will fallback to opening mailto: links (attachments not included).

const EMAIL_CONFIG = {
  // recipients: put the Gmail addresses you want notifications sent to
  RECIPIENTS: [
    "lucapellegrino1666@gmail.com"
  ],

  // method: 'emailjs' to enable client-side email send via EmailJS. Leave null for fallback mailto behavior.
  METHOD: null,

  // If using EmailJS, set these values (create them on emailjs.com)
  USER_ID: "YOUR_EMAILJS_USER_ID",
  SERVICE_ID: "YOUR_SERVICE_ID",
  TEMPLATE_ID: "YOUR_TEMPLATE_ID"
};
