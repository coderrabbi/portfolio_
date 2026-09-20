# coderrabbi contact inquiry email

Files:
- coderrabbi-inquiry.html: upload this file to Resend.
- preview.html: open locally to see the design with fictional example content.
- sample-variables.json: example values for the template variables.

## Resend setup

1. In your Resend template editor, choose Upload HTML and select coderrabbi-inquiry.html.
2. Name the template "coderrabbi — New inquiry".
3. Set From to coderrabbi <contact@coderrabbi.me> (your verified domain).
4. Set Subject to "New inquiry — coderrabbi portfolio".
5. Review the imported variables and use sample-variables.json for a preview. Define matching string variables if the import does not create them automatically.
6. Preview and publish when ready, then copy the template ID for the application integration.

Variables: CONTACT_NAME, CONTACT_EMAIL, CONTACT_COMPANY, PROJECT_TYPE, PROJECT_BUDGET, PROJECT_MESSAGE_HTML, INQUIRY_ID.

The intended recipient is coderrabbi@gmail.com. This is an internal new-inquiry notification, not an automatic response to the visitor.

## Application integration

Uploading or publishing this template does not automatically change the website's current email sender. The server must send template: { id: "YOUR_TEMPLATE_ID", variables: { ... } } instead of the existing html body. Set reply_to to the visitor's validated email address so the email's Reply action works. Keep API keys server-side.

Escape visitor-provided text before inserting it into HTML. PROJECT_MESSAGE_HTML must contain escaped message text with newline characters converted to <br>; never pass raw visitor HTML. Validate CONTACT_EMAIL as an email address and escape it for use in the mailto attribute. Supply all variables; use "Not provided" for optional fields with no value.

Reference: https://resend.com/blog/introducing-templates

## Design

600px table layout, inline base styles, system fonts, navy header with blue accents, responsive stacked details on narrow screens, solid background fallback for clients that ignore gradients. No external images, scripts, or fonts are required. The browser preview is an example, not proof of rendering in every email client; review Resend's preview and a test email before production use.
